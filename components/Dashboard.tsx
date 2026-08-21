import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { db } from "../services/database";
import {
  Transaction,
  Account,
  UserProfile,
  Card,
  CryptoAsset,
  Recipient,
  AccountType,
  Task,
  TransactionStatus,
  Notification,
  NotificationType
} from "../types";
import { useRealTimeLedger } from "../hooks/useRealTimeLedger";
import { PaymentProofScannerModal } from "./PaymentProofScannerModal";
import { SecurityHealthGaugeWidget } from "./SecurityHealthGaugeWidget";
import { KycProgressCard } from "./KycProgressCard";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  ArrowDownLeft as LucideArrowDownLeft,
  ArrowUpRight as LucideArrowUpRight,
  ShieldCheck as LucideShieldCheck,
  Cpu as LucideCpu,
  RefreshCw as LucideRefreshCw,
  ChevronRight as LucideChevronRight,
  TrendingDown as LucideTrendingDown,
} from "lucide-react";
import {
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  TrendingUpIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  VerifiedBadgeIcon,
  SunIcon,
  VisaIcon,
  MastercardIcon,
  ChartBarIcon,
  PremiumReservedBankLogo,
  ArrowsRightLeftIcon,
  WifiIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  GlobeAmericasIcon,
  ServerIcon,
  CloudArrowUpIcon,
  Cog8ToothIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  PiggyBankIcon,
  BuildingOfficeIcon,
  BankIcon,
  CreditCardIcon,
  WalletIcon,
  EmvChipIcon,
  BtcIcon,
  AppleIcon,
  BrandLogo,
  CheckCircleIcon,
  SpinnerIcon,
  GiftIcon,
  TvIcon,
  XIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  ActivityIcon,
  QrCodeIcon,
  FlagIcon,
  PlusIcon,
} from "./Icons";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { EXCHANGE_RATES } from "./constants";
import { GlobalBankingNetwork } from "./GlobalBankingNetwork";
import { QuickTransfer } from "./QuickTransfer";
import { SavingsVaults } from "./SavingsVaults";
import { SavingsGoalTracker } from "./SavingsGoalTracker";
import { SpendingAnalyticsWidget } from "./SpendingAnalyticsWidget";
import { DigitalHub } from "./DigitalHub";
import { ComplianceHaltModal } from "./ComplianceHaltModal";
import { PremiumCard, CARD_BACKGROUNDS } from "./CardManagement";
import { AccountDetailModal } from "./Accounts";
import { HistoricalNetWorthWidget } from "./HistoricalNetWorthWidget";
import { ScanReceiptModal } from "./ScanReceiptModal";
import { BudgetingGoalsWidget } from "./BudgetingGoalsWidget";
import { QrScanner } from "./QrScanner";
import { QrSuccessOverlay } from "./QrSuccessOverlay";
import { QrContactPrompt } from "./QrContactPrompt";
import { DashboardBanners } from "./DashboardBanners";
import { LinkedExternalAccountsWidget } from "./LinkedExternalAccountsWidget";
import { BudgetVsSpendingD3Chart } from "./BudgetVsSpendingD3Chart";
import { AnimatedCounter as SharedAnimatedCounter } from "./AnimatedCounter";
import { ComplianceRecordsWidget } from "./ComplianceRecordsWidget";
import { USBankingRailsHub } from "./USBankingRailsHub";
import { VisualExpenseBreakdown } from "./VisualExpenseBreakdown";
import { Camera as LucideCamera } from "lucide-react";

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  userProfile: UserProfile;
  totalNetWorth: number;
  portfolioChange24h: number;
  displayCurrency?: string;
  cards: Card[];
  cryptoAssets: CryptoAsset[];
  onOpenSendMoneyFlow: (initialTab?: "send" | "split" | "deposit") => void;
  recipients: Recipient[];
  onAddRecipient?: (recipient: Recipient) => void;
  onDeleteRecipient?: (id: string) => void;
  createTransaction: (
    transaction: Omit<
      Transaction,
      "id" | "status" | "statusTimestamps" | "type"
    >,
  ) => Promise<Transaction | null>;
  onOpenCurrencyConverter?: () => void;
  onOpenReceive?: () => void;
  onContactSupport?: () => void;
  btcBalance?: number;
  tasks?: Task[];
  toggleTask?: (id: string) => void;
  isAccountsLoading?: boolean;
  onAddFunds?: (amount: number) => Promise<void>;
  verificationLevel?: number;
  notifications?: Notification[];
}

// ... DigitalAssetStore component remains unchanged ...
const DigitalAssetStore: React.FC<{
  accounts: Account[];
  createTransaction: any;
  userProfile: UserProfile;
}> = ({ accounts, createTransaction, userProfile }) => {
  // ... (state and effects remain same)
  const [activeTab, setActiveTab] = useState<"apple" | "steam" | "amazon">(
    "apple",
  );
  const [purchaseState, setPurchaseState] = useState<
    "idle" | "gateway" | "processing" | "success"
  >("idle");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [amount, setAmount] = useState("50");
  const [showCompliance, setShowCompliance] = useState(false);

  const navigate = useNavigate();

  const handleInitiatePurchase = () => {
    navigate("/digital-store");
  };

  const handleComplianceSuccess = () => {
    setShowCompliance(false);
    setPurchaseState("gateway");
  };

  const executePayment = async (methodId: string) => {
    if (userProfile?.disabledPaymentMethods?.includes(methodId)) {
      alert("This payment method is temporarily unavailable for your account due to regulatory compliance checks.");
      setPurchaseState("idle");
      return;
    }

    setSelectedMethod(methodId);
    setPurchaseState("processing");

    const totalAmount = parseFloat(amount);
    const primaryAccount = accounts[0];

    if (methodId === "stripe") {
      try {
        const stored = sessionStorage.getItem("active_user_profile");
        let email = "unknown@example.com";
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) email = parsed.email;
        }

        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            purpose: `Digital Store: ${activeTab.toUpperCase()}`,
            email: email,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.open(
            data.url,
            "stripe_popup",
            "width=600,height=800,scrollbars=yes,resizable=yes",
          );
          // Wait for dummy simulation since real webhooks are beyond preview sandbox
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          alert(
            data.error ||
              "Server rejected payment: Stripe credentials missing or invalid.",
          );
          setPurchaseState("idle");
          return; // Block bypass!
        }
      } catch (e) {
        alert("Network Error connecting to secure gateway.");
        setPurchaseState("idle");
        return;
      }
    } else {
      // Process other methods
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    await createTransaction({
      accountId: primaryAccount.id,
      recipient: {
        id: "store",
        fullName:
          activeTab === "apple"
            ? "Apple Store"
            : activeTab === "steam"
              ? "Steam"
              : "Amazon",
        accountNumber: "DIGITAL",
        bankName: "Digital Store",
        isFavorite: false,
        country: {
          code: "US",
          name: "United States",
          currency: "USD",
          symbol: "$",
        },
      },
      sendAmount: totalAmount,
      receiveAmount: totalAmount,
      fee: 0,
      exchangeRate: 1,
      description: `Digital Store: ${activeTab.toUpperCase()}`,
    });

    if (activeTab === "apple") {
      setGeneratedCode(
        `X${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      );
    } else if (activeTab === "steam") {
      setGeneratedCode(
        `${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      );
    } else if (activeTab === "amazon") {
      setGeneratedCode(
        `AQ${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      );
    }
    setPurchaseState("success");
  };

  const resetStore = () => {
    setPurchaseState("idle");
    setGeneratedCode("");
    setAmount("50");
    setSelectedMethod("");
  };

  const PAYMENT_METHODS = [
    {
      id: "stripe",
      label: "Credit Card (Stripe)",
      icon: CreditCardIcon,
      color: "bg-[#635BFF]",
      type: "card",
    },
    { id: "paypal", label: "PayPal", domain: "paypal.com", type: "logo" },
    { id: "cashapp", label: "Cash App", domain: "cash.app", type: "logo" },
    { id: "zelle", label: "Zelle", domain: "zellepay.com", type: "logo" },
    { id: "wise", label: "Wise", domain: "wise.com", type: "logo" },
    {
      id: "bank",
      label: "Bank Wire",
      icon: BankIcon,
      color: "bg-slate-100 dark:bg-slate-700",
      type: "card",
    },
  ];

  return (
    <>
      {showCompliance && (
        <ComplianceHaltModal
          isOpen={true}
          amount={parseFloat(amount)}
          onVerified={handleComplianceSuccess}
          onCancel={() => setShowCompliance(false)}
          onContactSupport={() => {}}
        />
      )}

      {purchaseState === "gateway" && (
        <div className="fixed inset-0 z-[60] bg-slate-100  flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                  Checkout
                </h3>
                <p className="text-xs text-[#0F172A] font-bold uppercase tracking-wider">
                  Secure Payment Gateway
                </p>
              </div>
              <button
                onClick={() => setPurchaseState("idle")}
                className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <XIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="primary- dark:primary- p-4 rounded-2xl flex justify-between items-center border primary- dark:primary-">
                <span className="text-xs font-bold primary- dark:primary- uppercase tracking-widest">
                  Total Due
                </span>
                <span className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>

              <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em] pl-1">
                Select Payment Method
              </p>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {PAYMENT_METHODS.filter((method) => !userProfile?.disabledPaymentMethods?.includes(method.id)).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => executePayment(method.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:border-primary/50 hover:bg-white dark:hover:bg-white dark:bg-slate-900 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ${method.type === "logo" ? "bg-white p-1" : method.color + " text-[#0F172A] dark:text-white"}`}
                    >
                      {method.type === "logo" ? (
                        <BrandLogo
                          domain={method.domain}
                          name={method.label}
                          fallback={GlobeAmericasIcon}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        method.icon && <method.icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">
                        {method.label}
                      </p>
                      <p className="text-[10px] text-[#0F172A] uppercase tracking-wider">
                        Instant Processing
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-[#0F172A] dark:text-white ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {purchaseState === "processing" && (
        <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-300 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2 dark:bg-slate-800">
              {selectedMethod === "stripe" ? (
                <CreditCardIcon className="w-8 h-8 text-[#635BFF]" />
              ) : (
                <GlobeAmericasIcon className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
            {selectedMethod === "stripe"
              ? "Redirecting to Stripe..."
              : `Contacting ${selectedMethod}...`}
          </h3>
          <p className="text-[#0F172A] dark:text-white text-sm mt-2 uppercase tracking-widest font-bold animate-pulse">
            Securing Payment Channel
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-5 h-full flex flex-col relative overflow-y-auto custom-scrollbar transition-all group hover:border-slate-300 dark:hover:border-white/20 shadow-xl dark:shadow-black/40 hover:shadow-2xl">
        {/* Dynamic Ambient Background Based on Tab */}
        <div className="absolute inset-0 z-0 transition-opacity duration-1000">
          <div
            className={`absolute top-0 right-0 w-[300px] h-[300px] -mt-16 -mr-16 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${
              activeTab === "apple"
                ? "bg-indigo-500"
                : activeTab === "steam"
                  ? "primary-"
                  : "bg-orange-500"
            }`}
          ></div>
        </div>

        <div className="flex justify-between items-center mb-5 relative z-10 w-full">
          <div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-br from-white/10 to-transparent rounded-lg border border-slate-100 dark:border-white/10 shadow-inner">
                <GiftIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />
              </span>
              Store & Gifts
            </h3>
            <p className="text-[9px] text-[#0F172A] dark:text-white font-bold uppercase tracking-[0.2em] mt-1">
              Premium Integrations
            </p>
          </div>
          <Link
            to="/digital-store"
            className="p-2 bg-white hover:bg-white border border-slate-100 dark:border-white/10 rounded-full transition-all text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white shadow-sm  group-hover:scale-105 dark:bg-slate-800"
          >
            <ArrowRightIcon className="w-4 h-4 -rotate-45" />
          </Link>
        </div>

        {/* Highly Stylized Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 relative z-10 mb-5  shadow-inner gap-1 mx-auto w-full max-w-sm">
          <button
            onClick={() => {
              setActiveTab("apple");
              resetStore();
            }}
            className={`flex-1 py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "apple" ? "bg-white text-black shadow-[0_2px_10px_rgba(0,0,0,0.1)] scale-[1.02] z-10 font-bold" : "text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white"}`}
          >
            <AppleIcon className="w-3.5 h-3.5 text-black dark:text-white" />{" "}
            <span className="text-[10px] hidden sm:inline">Apple</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("steam");
              resetStore();
            }}
            className={`flex-1 py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "steam" ? "bg-gradient-to-r primary- to-[#171a21] text-white shadow-md primary- border primary- scale-[1.02] z-10 font-bold" : "text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white"}`}
          >
            <BrandLogo
              domain="steamcommunity.com"
              name="Steam"
              fallback={TvIcon}
              className="w-3.5 h-3.5"
            />{" "}
            <span className="text-[10px] hidden sm:inline">Steam</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("amazon");
              resetStore();
            }}
            className={`flex-1 py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "amazon" ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md shadow-yellow-500/30 scale-[1.02] z-10 font-bold" : "text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white"}`}
          >
            <BrandLogo
              domain="amazon.com"
              name="Amazon"
              fallback={TvIcon}
              className="w-3.5 h-3.5"
            />{" "}
            <span className="text-[10px] hidden sm:inline">Amazon</span>
          </button>
        </div>

        <div className="flex-grow w-full relative z-10 flex flex-col justify-center">
          {activeTab === "apple" && (
            <div className="h-full flex flex-col justify-between animate-fade-in gap-4">
              {purchaseState === "success" ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-gradient-to-bl primary- via-fuchsia-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(236,72,153,0.4)] relative">
                    <div className="absolute inset-0 bg-white  rounded-3xl dark:bg-slate-800"></div>
                    <AppleIcon className="w-10 h-10 text-white relative z-10" />
                  </div>
                  <p className="text-[#0F172A] dark:text-white text-xs uppercase font-black tracking-[0.2em] mb-3">
                    Your Digital Code
                  </p>
                  <div className="bg-white dark:bg-slate-800  border border-slate-200 dark:border-white/10 p-5 rounded-2xl font-mono text-xl text-[#0F172A] dark:text-white tracking-[0.3em] select-all cursor-pointer hover:border-slate-300 dark:hover:border-white/40 transition-colors shadow-inner w-fit mx-auto">
                    {generatedCode}
                  </div>
                  <button
                    onClick={resetStore}
                    className="mt-8 text-xs bg-slate-50 text-white dark:bg-slate-900 dark:text-black font-bold uppercase tracking-widest px-8 py-4 rounded-full hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
                  >
                    Purchase Another
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-slate-800  border border-white/50 dark:border-white/10 rounded-[1.5rem] p-5 relative overflow-hidden group shadow-2xl h-32 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=800&auto=format&fit=crop"
                      alt="Apple Ecosystem"
                      className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-30 mix-blend-luminosity scale-110 group-hover:scale-125 group-hover:opacity-40 transition-all duration-[3s]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl primary- via-fuchsia-500 to-yellow-500 rounded-full blur-[60px] opacity-20 dark:opacity-40 animate-pulse group-hover:opacity-60 transition-opacity duration-1000"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/80 via-white/40 to-transparent dark:from-black/80 dark:via-black/40"></div>

                    <div className="relative z-10 w-full flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0F172A] dark:text-white mb-1">
                          Apple Gift Card
                        </p>
                        <p className="text-xl font-black text-[#0F172A] dark:text-white tracking-tighter mix-blend-difference leading-none">
                          App Store &<br />
                          iTunes
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800  rounded-xl border border-white/40 dark:border-white/10 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <AppleIcon className="w-8 h-8 text-[#0F172A] dark:text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {["25", "50", "100"].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border  ${amount === val ? "bg-slate-50 dark:bg-slate-900 text-white dark:text-black border-transparent shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] scale-[1.02]" : "bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 hover:bg-white dark:hover:bg-white"}`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleInitiatePurchase}
                      className="w-full py-3 bg-slate-100 dark:bg-slate-900 text-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-xl hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_10px_40px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <AppleIcon className="w-4 h-4" />{" "}
                      <span>Purchase via Pay</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "steam" && (
            <div className="h-full flex flex-col justify-between animate-fade-in gap-4">
              {purchaseState === "success" ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-[#171a21] rounded-full flex items-center justify-center mx-auto mb-6 border primary- shadow-[0_0_50px_rgba(59,130,246,0.4)]">
                    <BrandLogo
                      domain="steamcommunity.com"
                      name="Steam"
                      fallback={TvIcon}
                      className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                  <p className="primary- text-xs uppercase font-black tracking-[0.2em] mb-3">
                    Wallet Code
                  </p>
                  <div className="bg-[#171a21] border primary- p-5 rounded-2xl font-mono text-xl primary- tracking-[0.2em] select-all w-fit mx-auto shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                    {generatedCode}
                  </div>
                  <button
                    onClick={resetStore}
                    className="mt-8 text-xs primary- font-bold uppercase tracking-widest px-6 py-3 border primary- rounded-full hover:primary- hover:text-[#0F172A] dark:text-white transition-colors"
                  >
                    Buy More Credit
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-4">
                  <div className="bg-gradient-to-tr from-[#1b2838] to-[#2a475e] border border-[#66c0f4]/20 rounded-[1.5rem] p-5 relative overflow-hidden group shadow-2xl h-32 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=600&auto=format&fit=crop"
                      alt="Steam Wallet"
                      className="absolute top-0 right-0 w-full h-full object-cover opacity-60 mix-blend-color-dodge scale-110 group-hover:scale-125 transition-transform duration-[3s]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1b2838]/90 via-[#1b2838]/60 to-transparent"></div>
                    <div className="flex items-start gap-4 relative z-10 w-full justify-between items-center">
                      <div>
                        <p className="text-[9px] text-[#66c0f4] uppercase tracking-widest font-bold mb-1">
                          Instant Digital Delivery
                        </p>
                        <p className="text-xl font-black text-[#0F172A] dark:text-white tracking-tighter drop-shadow-md leading-none">
                          Steam Wallet
                        </p>
                      </div>
                      <div className="bg-[#171a21] p-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/10">
                        <BrandLogo
                          domain="steamcommunity.com"
                          name="Steam"
                          fallback={TvIcon}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {["20", "50", "100", "200"].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${amount === val ? "bg-gradient-to-br from-[#66c0f4] to-[#1999e3] text-[#0F172A] dark:text-white border-transparent shadow-[0_10px_30px_-10px_rgba(102,192,244,0.6)] scale-[1.02]" : "bg-[#1b2838] text-[#0F172A] dark:text-white border-[#2a475e] hover:border-[#66c0f4]/50"}`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleInitiatePurchase}
                      className="w-full py-3 bg-gradient-to-r from-[#66c0f4] to-[#1999e3] text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:shadow-[0_0_30px_rgba(102,192,244,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 border primary-"
                    >
                      <span>Enter Store Gateway</span>{" "}
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "amazon" && (
            <div className="h-full flex flex-col justify-between animate-fade-in gap-4">
              {purchaseState === "success" ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(250,175,0,0.4)] dark:bg-slate-800">
                    <BrandLogo
                      domain="amazon.com"
                      name="Amazon"
                      fallback={TvIcon}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <p className="text-orange-500/80 text-xs uppercase font-black tracking-[0.2em] mb-3">
                    Amazon Claim Code
                  </p>
                  <div className="bg-white dark:bg-slate-800 border border-orange-500/40 p-5 rounded-2xl font-mono text-xl text-[#0F172A] dark:text-orange-300 tracking-[0.2em] select-all w-fit mx-auto shadow-inner">
                    {generatedCode}
                  </div>
                  <button
                    onClick={resetStore}
                    className="mt-8 text-xs bg-orange-500 text-[#0F172A] font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-orange-400 transition-colors"
                  >
                    Buy Another Card
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-4">
                  <div className="bg-gradient-to-tr from-orange-200 to-yellow-500 dark:from-yellow-700 dark:to-orange-900 border border-orange-400/20 rounded-[1.5rem] p-5 relative overflow-hidden group shadow-2xl h-32 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?q=80&w=600&auto=format&fit=crop"
                      alt="Amazon Gift Card"
                      className="absolute top-0 right-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-110 group-hover:scale-125 transition-transform duration-[3s]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-100/90 dark:from-black/80 via-transparent to-transparent"></div>
                    <div className="flex items-start gap-4 relative z-10 w-full justify-between items-center">
                      <div>
                        <p className="text-[9px] text-orange-800 dark:text-orange-300 uppercase tracking-widest font-bold mb-1">
                          Shop Everything
                        </p>
                        <p className="text-xl font-black text-[#0F172A] dark:text-white tracking-tighter drop-shadow-sm leading-none">
                          Amazon Gift Card
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] border border-slate-100 dark:bg-slate-800">
                        <BrandLogo
                          domain="amazon.com"
                          name="Amazon"
                          fallback={TvIcon}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {["25", "50", "100", "200"].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${amount === val ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-[#0F172A] border-transparent shadow-[0_10px_30px_-10px_rgba(245,158,11,0.6)] scale-[1.02]" : "bg-slate-50 dark:bg-[#1b2838] text-[#0F172A] dark:text-white border-slate-200 dark:border-[#2a475e] hover:border-orange-400/50"}`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleInitiatePurchase}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#0F172A] font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 border border-orange-300/30"
                    >
                      <span>Enter Store Gateway</span>{" "}
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ... MyCardsWidget, AccountsWidget, CryptoWatchlistWidget, RecentActivityWidget ...
// (These remain unchanged unless you specifically need them modified for context)

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const MyCardsWidget: React.FC<{ cards: Card[] }> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [localFrozen, setLocalFrozen] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const toggleFreeze = () => {
    const id = cards[currentIndex]?.id;
    if (!id) return;
    setLocalFrozen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetails = () => {
    const id = cards[currentIndex]?.id;
    if (!id) return;
    setShowDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prev) => (prev + newDirection + cards.length) % cards.length,
    );
  };

  const nextCard = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    paginate(1);
  };

  const prevCard = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    paginate(-1);
  };

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full relative overflow-hidden text-[#0F172A] dark:text-white transition-all duration-300 flex flex-col group shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/20">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6 relative z-20">
        <div>
          <Link
            to="/cards"
            className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight hover:text-primary transition-colors flex items-center gap-2"
          >
            <CreditCardIcon className="w-6 h-6 text-primary" /> My Cards
          </Link>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#0F172A] dark:text-white mt-1">
            Real-time Management
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {cards.length > 1 && (
            <div className="flex gap-1 mr-2">
              <button
                onClick={prevCard}
                className="p-2 bg-white rounded-full hover:bg-white transition-all text-[#0F172A] dark:text-white z-30 shadow-md dark:bg-slate-800"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={nextCard}
                className="p-2 bg-white rounded-full hover:bg-white transition-all text-[#0F172A] dark:text-white z-30 shadow-md dark:bg-slate-800"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <Link
            to="/cards"
            className="p-2 bg-primary/20 rounded-full hover:bg-primary transition-all text-primary hover:text-[#0F172A] dark:text-white z-30 border border-primary/30"
          >
            <PlusIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="flex-grow w-full flex flex-col justify-center relative z-10 px-4">
        {cards.length > 0 ? (
          <div className="w-full relative min-h-[300px] flex items-center justify-center">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{
                  opacity: 0,
                  x: direction > 0 ? 200 : -200,
                  zIndex: 0,
                  scale: 0.7,
                  rotateY: direction > 0 ? 60 : -60,
                  rotateZ: direction > 0 ? 10 : -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  zIndex: 10,
                  scale: 1.15,
                  rotateY: 0,
                  rotateZ: 0,
                }}
                exit={{
                  opacity: 0,
                  x: direction > 0 ? -200 : 200,
                  zIndex: 0,
                  scale: 0.7,
                  rotateY: direction > 0 ? -60 : 60,
                  rotateZ: direction > 0 ? -10 : 10,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 20,
                  mass: 1.2,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) paginate(1);
                  else if (swipe > swipeConfidenceThreshold) paginate(-1);
                }}
                className="w-full max-w-[420px] absolute perspective-[2500px]"
              >
                <motion.div
                  className="drop-shadow-[0_45px_65px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing relative"
                  whileHover={{ scale: 1.08, translateY: -15, rotateX: 3, rotateY: -3 }}
                  whileTap={{ scale: 0.92, rotateX: 10, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  {/* Simulated subtle shine/glare overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none rounded-[2.2rem] z-20 transition-opacity duration-300"></div>
                  <PremiumCard
                    card={{
                      ...cards[currentIndex],
                      controls: {
                        ...(cards[currentIndex]?.controls || {
                          isFrozen: false,
                          onlinePurchases: true,
                          internationalTransactions: true,
                          blockedCategories: [],
                        }),
                        isFrozen:
                          localFrozen[cards[currentIndex]?.id] ??
                          cards[currentIndex]?.controls?.isFrozen ??
                          false,
                      },
                    }}
                    backgroundUrl={
                      CARD_BACKGROUNDS[currentIndex % CARD_BACKGROUNDS.length]
                    }
                    forceReveal={showDetails[cards[currentIndex]?.id] || false}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 w-full border border-dashed border-slate-300 dark:border-black/10 bg-white rounded-3xl text-[#0F172A] dark:text-white text-sm font-bold uppercase tracking-widest  dark:bg-slate-800">
            No Active Cards
          </div>
        )}

        {/* Active Card Actions */}
        {cards.length > 0 && (
          <motion.div
            key={`actions-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-3 w-full max-w-sm mx-auto"
          >
            <button
              onClick={toggleFreeze}
              className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:border-white/10 active:scale-95 dark:bg-slate-800"
            >
              <LockClosedIcon
                className={`w-5 h-5 ${localFrozen[cards[currentIndex]?.id] ? "text-red-500" : "text-emerald-400"}`}
              />
              <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">
                {localFrozen[cards[currentIndex]?.id]
                  ? "Unfreeze"
                  : "Freeze Card"}
              </span>
            </button>
            <button
              onClick={toggleDetails}
              className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:border-white/10 active:scale-95 dark:bg-slate-800"
            >
              {showDetails[cards[currentIndex]?.id] ? (
                <EyeSlashIcon className="w-5 h-5 primary-" />
              ) : (
                <EyeIcon className="w-5 h-5 primary-" />
              )}
              <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">
                {showDetails[cards[currentIndex]?.id]
                  ? "Hide Info"
                  : "Show Info"}
              </span>
            </button>
            <button
              onClick={() => navigate("/cards")}
              className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:border-white/10 active:scale-95 dark:bg-slate-800"
            >
              <Cog8ToothIcon className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">
                Settings
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {cards.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 relative z-20">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-primary shadow-[0_0_10px_rgba(14,197,242,0.5)]" : "w-2 bg-white hover:bg-white"}`}
            />
          ))}
        </div>
      )}
      <style>{`
                .perspective-1000 { perspective: 1000px; transform-style: preserve-3d; }
            `}</style>
    </div>
  );
};

const MiniAccountCard: React.FC<{
  acc: Account;
  visuals: { img: string; color: string };
  onAccountClick: (acc: Account) => void;
  copiedId: string | null;
  handleCopy: (e: React.MouseEvent, acc: Account) => void;
  formatCurrency: (amount: number) => string;
}> = ({ acc, visuals, onAccountClick, copiedId, handleCopy, formatCurrency }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-100, 100], [6, -6]);
  const rotateY = useTransform(mouseX, [-100, 100], [-6, 6]);

  const bgTransform = useTransform(
    [rotateX, rotateY],
    ([rx, ry]) => `scale(1.2) translateX(${-(ry as number) * 1.5}px) translateY(${(rx as number) * 1.5}px) translateZ(-15px)`
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      onClick={() => onAccountClick(acc)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        y: -3,
        zIndex: 10,
        boxShadow:
          "0 20px 30px -8px rgba(0,0,0,0.45), 0 0 24px 2px rgba(16,185,129,0.22), 0 0 8px rgba(255,255,255,0.1)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="relative overflow-hidden rounded-2xl group cursor-pointer border border-transparent hover:border-emerald-400/40 transition-colors duration-300 shadow-md min-h-[90px] flex items-center p-4 transform-gpu"
    >
      {/* Soft Ambient Hover Glow Layer */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-400/0 group-hover:ring-emerald-400/35 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10"></div>

      <motion.div
        className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transition-transform duration-300 ease-out z-0 opacity-60 group-hover:opacity-90 mix-blend-luminosity"
        style={{
          backgroundImage: `url(${visuals.img})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: bgTransform,
        }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${visuals.color} mix-blend-multiply opacity-90 z-0 pointer-events-none`}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white  rounded-xl text-white border border-white/20 shadow-inner group-hover:bg-white group-hover:text-[#0F172A] transition-all dark:bg-slate-800">
            <BankIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-wide group-hover:text-primary-300 drop-shadow-md">
              {acc.nickname || acc.type}
            </p>
            <div
              className="flex items-center gap-2 mt-1"
              onClick={(e) => handleCopy(e, acc)}
            >
              <p className="text-[10px] text-[#0F172A] font-mono tracking-widest hover:text-white transition-colors bg-slate-100 px-2 py-0.5 rounded-full border border-black/5">
                {acc.accountNumber}
              </p>
              <span className="text-[8px] font-black uppercase text-emerald-400 drop-shadow-md">
                {copiedId === acc.id ? "Copied" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-black text-white drop-shadow-lg">
            <SharedAnimatedCounter value={(acc?.balance || 0)} formatCurrency={formatCurrency} />
          </p>
          <p className="text-[9px] uppercase tracking-widest font-bold text-[#0F172A] mt-0.5">
            Available
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const AccountsWidget: React.FC<{
  accounts: Account[];
  onAccountClick: (account: Account) => void;
  isAccountsLoading?: boolean;
}> = ({ accounts, onAccountClick, isAccountsLoading }) => {
  const { formatCurrency } = useCurrency();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCopy = (e: React.MouseEvent, acc: Account) => {
    e.stopPropagation();
    navigator.clipboard.writeText(acc.accountNumber);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2500); // Simulate network sync
  };

  const navigate = useNavigate();

  const getAccountVisuals = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("checking") || t.includes("current"))
      return {
        img: "https://images.unsplash.com/photo-1616803140344-6682afb13cda?auto=format&fit=crop&q=80&w=800",
        color: "primary- to-slate-900/90",
      };
    if (t.includes("saving"))
      return {
        img: "https://images.unsplash.com/photo-1549421263-6064833b071b?auto=format&fit=crop&q=80&w=800",
        color: "from-emerald-600/80 to-slate-900/90",
      };
    if (t.includes("invest") || t.includes("broker"))
      return {
        img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
        color: "from-purple-600/80 to-slate-900/90",
      };
    if (t.includes("credit"))
      return {
        img: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&q=80&w=800",
        color: "from-rose-600/80 to-slate-900/90",
      };
    return {
      img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
      color: "from-slate-700/80 to-slate-900/90",
    };
  };

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full flex flex-col hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-xl dark:shadow-black/40 hover:shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <BankIcon className="w-32 h-32 text-primary" />
      </div>

      {isSyncing && (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 [2px] z-20 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary mt-4">
            Syncing Ledger...
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">
            Ledgability Accounts
          </h3>
          <button
            onClick={handleSync}
            className="p-1 hover:bg-slate-200 dark:hover:bg-white rounded-full transition-colors text-[#0F172A] hover:text-primary dark:bg-slate-800"
          >
            <ArrowsRightLeftIcon
              className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <Link
          to="/accounts"
          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <button
          onClick={() => navigate("/deposits")}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-500 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 rounded-2xl transition-all group shadow-sm text-emerald-600 dark:text-emerald-400 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full blur-xl group-hover:bg-emerald-500 transition-all pointer-events-none"></div>
          <LucideArrowDownLeft className="w-6 h-6 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform" />
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block mb-0.5">
              Deposit
            </span>
          </div>
        </button>
        <button
          onClick={() => navigate("/withdrawals")}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 hover:bg-sky-500 dark:hover:bg-sky-500 border border-slate-200 dark:border-white/10 hover:border-sky-500/30 rounded-2xl transition-all group shadow-sm text-sky-600 dark:text-sky-400 relative overflow-hidden"
        >
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-sky-500 rounded-full blur-xl group-hover:bg-sky-500 transition-all pointer-events-none"></div>
          <LucideArrowUpRight className="w-6 h-6 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 block mb-0.5">
              Withdraw
            </span>
          </div>
        </button>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {isAccountsLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 rounded-xl bg-white animate-pulse dark:bg-slate-800"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg w-8 h-8"></div>
                  <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-white dark:bg-slate-900 rounded w-1/3"></div>
                    <div className="h-3 bg-white dark:bg-slate-900 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-4 bg-white dark:bg-slate-900 rounded w-16"></div>
              </div>
            ))
          : accounts.slice(0, 3).map((acc) => {
              const visuals = getAccountVisuals(acc.type);
              return (
                <MiniAccountCard
                  key={acc.id}
                  acc={acc}
                  visuals={visuals}
                  onAccountClick={onAccountClick}
                  copiedId={copiedId}
                  handleCopy={handleCopy}
                  formatCurrency={formatCurrency}
                />
              );
            })}
      </div>
    </div>
  );
};

const CryptoWatchlistWidget: React.FC<{ cryptoAssets: CryptoAsset[] }> = ({
  cryptoAssets: initialAssets,
}) => {
  const [assets, setAssets] = useState(initialAssets);

  useEffect(() => {
    // Find matching symbols for Binance
    const supportedSymbols = initialAssets.map((a) => a.symbol + "USDT");

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setAssets((prevAssets) => {
            let updated = false;
            const newAssets = prevAssets.map((asset) => {
              const ticker = data.find((t) => t.s === asset.symbol + "USDT");
              if (ticker) {
                updated = true;
                const newPrice = parseFloat(ticker.c);
                const newChange = parseFloat(ticker.P); // price change percent
                const newHistory = [...asset.priceHistory.slice(1), newPrice];
                return {
                  ...asset,
                  price: newPrice,
                  change24h: newChange,
                  priceHistory: newHistory,
                };
              }
              return asset;
            });
            return updated ? newAssets : prevAssets;
          });
        }
      };
    } catch (error) {
      console.error("Binance WS error:", error);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full flex flex-col hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-xl dark:shadow-black/40 hover:shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <LucideRefreshCw className="w-32 h-32 text-primary animate-spin-slow" />
      </div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
          Live Watchlist{" "}
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
        </h3>
        <Link
          to="/crypto"
          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors"
        >
          Trade
        </Link>
      </div>
      <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {assets.slice(0, 3).map((asset) => (
          <Link
            key={asset.id}
            to="/crypto"
            className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100 dark:border-white/10 hover:border-primary/30 hover:bg-white transition-all group cursor-pointer dark:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <asset.icon className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 p-1.5 text-[#0F172A] dark:text-white group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white tracking-tight">
                  {asset.name}
                </p>
                <p className="text-[10px] text-[#0F172A] font-mono tracking-wider">
                  {asset.symbol}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-[#0F172A] dark:text-[#1E293B]">
                $
                {asset.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p
                className={`text-[10px] font-bold tracking-wider ${asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {asset.change24h >= 0 ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TasksWidget: React.FC<{
  tasks: Task[];
  toggleTask?: (id: string) => void;
}> = ({ tasks, toggleTask }) => {
  const highPriorityTasks = useMemo(
    () =>
      tasks.filter((t) => t.priority === "High" && !t.completed).slice(0, 3),
    [tasks],
  );

  const completionScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full flex flex-col hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-xl dark:shadow-black/40 hover:shadow-2xl relative overflow-hidden">
      {highPriorityTasks.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      )}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
          Priority Tasks
          {highPriorityTasks.length > 0 && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>
          )}
        </h3>
        <div className="flex items-center gap-3">
          <div
            className="px-2 py-1 rounded-md bg-white border border-slate-200 dark:border-white/10 text-[10px] font-bold text-[#0F172A] dark:text-white dark:bg-slate-800"
            title="Completion Score"
          >
            {completionScore}%
          </div>
          <Link
            to="/tasks"
            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors"
          >
            View All
          </Link>
        </div>
      </div>
      {highPriorityTasks.length > 0 ? (
        <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 relative z-10">
          {highPriorityTasks.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100 dark:border-white/10 hover:border-primary/30 hover:bg-white transition-all group dark:bg-slate-800"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (toggleTask) toggleTask(task.id);
                  }}
                  className="p-2 shrink-0 rounded-lg bg-red-500 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-[#0F172A] dark:text-white transition-all focus:outline-none"
                  title="Mark as completed"
                >
                  <FlagIcon className="w-4 h-4" />
                </button>
                <Link to="/tasks" className="min-w-0 flex-1 hover:opacity-80">
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors truncate">
                    {task.text}
                  </p>
                  <p className="text-[10px] text-[#0F172A] font-bold flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Due:{" "}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No Date"}
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-[#0F172A] text-xs font-bold uppercase tracking-widest gap-2 opacity-70 relative z-10">
          <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
          <span className="text-emerald-500">All Caught Up</span>
        </div>
      )}
    </div>
  );
};

const RecentActivityWidget: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const { formatCurrency } = useCurrency();
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const handleSync = () => {
      setIsSyncing(true);
      const timer = setTimeout(() => setIsSyncing(false), 2500);
      return () => clearTimeout(timer);
    };
    window.addEventListener("BALANCE_ADJUSTMENT_TRIGGERED", handleSync);
    return () => window.removeEventListener("BALANCE_ADJUSTMENT_TRIGGERED", handleSync);
  }, []);

  return (
    <div className={`bg-white dark:bg-[#0c121e] rounded-[2.5rem] p-8 h-full flex flex-col transition-all duration-500 shadow-xl dark:shadow-black/40 hover:shadow-2xl relative overflow-hidden border ${isSyncing ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01] bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}>
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <LucideRefreshCw className="w-32 h-32 text-primary" />
      </div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">
          Recent Activity
        </h3>
        <Link
          to="/history"
          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors"
        >
          Full Ledger
        </Link>
      </div>
      {transactions.length > 0 ? (
        <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 relative z-10">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center p-4 rounded-xl bg-white border border-slate-100 dark:border-white/10 hover:border-primary/30 hover:bg-white transition-all cursor-pointer group dark:bg-slate-800"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl border transition-colors ${tx.type === "credit" ? "bg-emerald-500 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500" : "bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 group-hover:bg-slate-100 dark:bg-slate-700"}`}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownCircleIcon className="w-5 h-5" />
                  ) : (
                    <ArrowUpCircleIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors tracking-tight">
                      {tx.description}
                    </p>
                    {tx.category && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500 text-indigo-400 border border-indigo-500/25 rounded text-[8px] font-bold uppercase tracking-wider select-none">
                        ✨ {tx.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-[10px] text-[#0F172A] font-mono">
                      {new Date(
                        tx.statusTimestamps?.[TransactionStatus.SUBMITTED] ||
                          Date.now(),
                      ).toLocaleDateString()}
                    </p>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={tx.status}
                        initial={{ opacity: 0, scale: 0.8, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -5 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`inline-block text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${tx.status === TransactionStatus.COMPLETED || tx.status === TransactionStatus.FUNDS_ARRIVED ? "bg-emerald-500 text-emerald-400" : tx.status === TransactionStatus.PAUSED_ON_HOLD ? "bg-indigo-500 text-indigo-400" : tx.status === TransactionStatus.FAILED ? "bg-red-500 text-red-500" : "bg-amber-500 text-amber-500"}`}
                      >
                        {tx.status}
                      </motion.span>
                    </AnimatePresence>
                    {tx.tags &&
                      tx.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-mono text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 px-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-mono text-sm font-bold ${tx.type === "credit" ? "text-emerald-400" : "text-[#0F172A] dark:text-white"}`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(
                    tx.type === "credit"
                      ? tx.sendAmount
                      : tx.sendAmount + tx.fee,
                  )}
                </p>
                <button className="text-[10px] font-bold text-[#0F172A] hover:text-primary transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest mt-1">
                  View Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-[#0F172A] text-xs font-bold uppercase tracking-widest gap-3 opacity-70 relative z-10">
          <LucideRefreshCw className="w-8 h-8 text-primary" />
          <span>No recent activity</span>
        </div>
      )}
    </div>
  );
};

const AnimatedCounter: React.FC<{
  value: number;
  formatCurrency: (v: number) => string;
  className?: string;
}> = ({ value, formatCurrency, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(0); // Start at 0 to animate fully on load
  const [animKey, setAnimKey] = useState(0);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setAnimKey(prev => prev + 1);
      prevValueRef.current = value;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const duration = 1200; // 1.2s smooth count up
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(startValue + (value - startValue) * easeProgress);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  return (
    <span
      key={animKey}
      className={`inline-block transition-all transform-gpu duration-700 ease-out animate-balance-fade-up animate-in fade-in slide-in-from-bottom-2 ${className}`}
    >
      {formatCurrency(displayValue)}
    </span>
  );
};

const NetWorthCard: React.FC<
  Pick<
    DashboardProps,
    | "userProfile"
    | "totalNetWorth"
    | "portfolioChange24h"
    | "displayCurrency"
    | "onOpenCurrencyConverter"
    | "onOpenReceive"
    | "accounts"
    | "onOpenSendMoneyFlow"
    | "btcBalance"
    | "cryptoAssets"
    | "isAccountsLoading"
  > & {
    isVisible: boolean;
    onToggle: () => void;
    onOpenScanReceipt: () => void;
    onOpenQrPay: () => void;
  }
> = ({
  userProfile,
  totalNetWorth,
  portfolioChange24h,
  displayCurrency = "USD",
  isVisible,
  onToggle,
  onOpenCurrencyConverter,
  onOpenReceive,
  accounts,
  onOpenSendMoneyFlow,
  btcBalance = 0,
  cryptoAssets = [],
  isAccountsLoading,
  onOpenScanReceipt,
  onOpenQrPay,
}) => {
  const {
    formatCurrency,
    displayCurrency: currentCurrency,
    rates,
  } = useCurrency();
  const [now, setNow] = useState(new Date());
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showAccountNum, setShowAccountNum] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showCardsLink, setShowCardsLink] = useState(false);
  const [isNetWorthPulsing, setIsNetWorthPulsing] = useState(false);

  // Dynamic, live-updating wealth history state for premium Net Worth tracking
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);
  const [selectedVelocityRange, setSelectedVelocityRange] = useState<
    "LIVE" | "1W" | "1M" | "3M" | "1Y"
  >("LIVE");
  const [targetNetWorthLimit, setTargetNetWorthLimit] =
    useState<number>(250000);
  const [showTargetLine, setShowTargetLine] = useState(true);
  const [liveTickerPulse, setLiveTickerPulse] = useState(false);
  const [lastTickChange, setLastTickChange] = useState<number>(1.25); // Current tick momentum

  // Initialize or re-sync historical trend data when totalNetWorth changes
  useEffect(() => {
    if (totalNetWorth > 0) {
      const needsRegeneration = netWorthHistory.length === 0 || 
        Math.abs(netWorthHistory[netWorthHistory.length - 1].netWorth - totalNetWorth) > 5;
        
      if (needsRegeneration) {
        const points = [];
        const nowTime = new Date();
        for (let i = 14; i >= 0; i--) {
          const time = new Date(nowTime.getTime() - i * 1.5 * 60 * 60 * 1000); // 1.5-hour intervals
          // Make the curve end exactly at the current true totalNetWorth
          const devPercentage = i === 0 ? 0 : (Math.sin(i * 0.9) * 0.008 + i * -0.002 + 0.01);
          const val = totalNetWorth * (1 + devPercentage);
          points.push({
            time: time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: time.toLocaleDateString([], { month: "short", day: "numeric" }),
            netWorth: parseFloat(val.toFixed(2)),
          });
        }
        setNetWorthHistory(points);
        setTargetNetWorthLimit(
          Math.round((totalNetWorth * 1.25) / 10000) * 10000 || 500000,
        );
      }
    }
  }, [totalNetWorth, netWorthHistory.length]);

  // Live continuous ticking loop for index updates
  useEffect(() => {
    let intervalId: any;
    if (
      selectedVelocityRange === "LIVE" &&
      totalNetWorth > 0 &&
      netWorthHistory.length > 0
    ) {
      intervalId = setInterval(() => {
        setLiveTickerPulse(true);
        setTimeout(() => setLiveTickerPulse(false), 800);

        const fluctuation = Math.random() * 41.5 - 18.2; // Fluctuates naturally with a positive drift
        setLastTickChange(fluctuation);

        setNetWorthHistory((prev) => {
          const copy = [...prev];
          const last = { ...copy[copy.length - 1] };
          const updatedVal = parseFloat(
            (last.netWorth + fluctuation).toFixed(2),
          );
          const nowTime = new Date();

          const newPoint = {
            time: nowTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            date: nowTime.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            }),
            netWorth: updatedVal,
          };

          if (copy.length >= 18) {
            return [...copy.slice(1), newPoint];
          } else {
            return [...copy, newPoint];
          }
        });
      }, 6000); // Tick every 6 seconds for dynamic realism
    }
    return () => clearInterval(intervalId);
  }, [selectedVelocityRange, totalNetWorth, netWorthHistory.length]);

  // Synced historical datasets computed dynamically for each time range
  const activeChartDataset = useMemo(() => {
    if (selectedVelocityRange === "LIVE") {
      return netWorthHistory;
    }

    const data = [];
    const base = totalNetWorth;
    const nowTime = new Date();
    const ptsCount =
      selectedVelocityRange === "1W"
        ? 7
        : selectedVelocityRange === "1M"
          ? 15
          : selectedVelocityRange === "3M"
            ? 12
            : 12;

    for (let i = ptsCount - 1; i >= 0; i--) {
      let itemDate = new Date();
      let label = "";
      let dateS = "";
      let valMultiplier = 1;

      if (selectedVelocityRange === "1W") {
        itemDate = new Date(nowTime.getTime() - i * 24 * 60 * 60 * 1000);
        label = itemDate.toLocaleDateString([], { weekday: "short" });
        dateS = itemDate.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        valMultiplier = 1 + Math.sin(i * 1.2) * 0.015 + i * -0.003 - 0.005;
      } else if (selectedVelocityRange === "1M") {
        itemDate = new Date(nowTime.getTime() - i * 2 * 24 * 60 * 60 * 1000);
        label = itemDate.toLocaleDateString([], {
          day: "numeric",
          month: "short",
        });
        dateS = itemDate.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        valMultiplier = 1 + Math.sin(i * 0.8) * 0.025 - i * 0.004 - 0.01;
      } else if (selectedVelocityRange === "3M") {
        itemDate = new Date(nowTime.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        label = `Wk ${ptsCount - i}`;
        dateS = `Week of ${itemDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
        valMultiplier =
          1 +
          Math.cos(i * 1.5) * 0.04 -
          i * 0.008 -
          Math.sin(i * 0.4) * 0.01 -
          0.02;
      } else {
        // 1Y
        itemDate = new Date(nowTime.getFullYear(), nowTime.getMonth() - i, 1);
        label = itemDate.toLocaleDateString([], { month: "short" });
        dateS = itemDate.toLocaleDateString([], {
          month: "long",
          year: "numeric",
        });
        valMultiplier =
          1 +
          Math.sin(i * 0.6) * 0.07 -
          i * 0.015 +
          Math.sin(i * 1.8) * 0.01 -
          0.04;
      }

      data.push({
        time: label,
        date: dateS,
        netWorth: parseFloat((base * valMultiplier).toFixed(2)),
      });
    }
    return data;
  }, [selectedVelocityRange, totalNetWorth, netWorthHistory]);

  const primaryAccount =
    accounts.find((a) => a.type === AccountType.CHECKING) || accounts[0];
  const accountNumber = primaryAccount
    ? primaryAccount.fullAccountNumber || primaryAccount.accountNumber
    : "32881903811";
  const maskedNumber = primaryAccount
    ? `**** ${primaryAccount.accountNumber.slice(-4)}`
    : "**** 3811";
  const TICKER_CURRENCIES = [
    "EUR",
    "GBP",
    "BTC",
    "JPY",
    "CHF",
    "CAD",
    "AUD",
    "CNY",
  ];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_CURRENCIES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!totalNetWorth) return;
    setIsNetWorthPulsing(true);
    const timer = setTimeout(() => setIsNetWorthPulsing(false), 1200);
    return () => clearTimeout(timer);
  }, [totalNetWorth]);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate USD value of held BTC dynamically from rates
  const btcPrice = rates["BTC"] ? 1 / rates["BTC"] : 65000;
  const btcValueUsd = btcBalance * btcPrice;

  // Calculate ticker values
  const targetCode = TICKER_CURRENCIES[tickerIndex];
  const rate = rates[targetCode] || EXCHANGE_RATES[targetCode] || 0;
  const convertedTickerVal = totalNetWorth * rate;

  let displayTickerVal = "";
  if (targetCode === "BTC") {
    displayTickerVal = `₿ ${convertedTickerVal.toFixed(4)}`;
  } else {
    try {
      displayTickerVal = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: targetCode,
      }).format(convertedTickerVal);
    } catch {
      displayTickerVal = `${targetCode} ${convertedTickerVal.toFixed(2)}`;
    }
  }

  return (
    <div className={`relative h-full flex flex-col justify-between overflow-y-auto custom-scrollbar text-white p-6 sm:p-8 lg:p-12 font-sans min-h-[500px] md:min-h-[500px] xl:min-h-[540px] rounded-3xl md:rounded-[2.5rem] transition-all duration-700 ease-out border ${isNetWorthPulsing ? "border-indigo-400/80 shadow-[0_0_40px_rgba(99,102,241,0.5)] ring-4 ring-indigo-500/20" : "border-black/5"}`}>
      <div className="absolute inset-0 z-0 bg-black  rounded-3xl md:rounded-[2.5rem]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10 z-0 rounded-3xl md:rounded-[2.5rem]"></div>

      {/* Content Layer (z-10) */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top Row: Profile & Time */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={userProfile.profilePictureUrl}
                alt={userProfile.name}
                className="w-14 h-14 rounded-full border-2 border-white/30 object-cover shadow-md "
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full w-4 h-4"></div>
            </div>
            {isAccountsLoading ? (
              <div className=" bg-white px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 w-32 h-12 animate-pulse dark:bg-slate-800"></div>
            ) : (
              <div className=" bg-white px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                <p className="text-sm primary- font-bold tracking-wide">
                  {getGreeting()}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                    {userProfile.name.split(" ")[0]}
                  </p>
                  <VerifiedBadgeIcon className="w-5 h-5 primary-" />
                </div>
              </div>
            )}
          </div>
          <div className="text-right  bg-slate-100 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/10">
            <p className="text-2xl font-bold tracking-tight font-mono leading-none text-white drop-shadow-md">
              {now.toLocaleTimeString("en-US", { hour12: false })}
            </p>
            <p className="text-xs primary- font-bold mt-1">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Balance Section */}
        <div className="mt-8 mb-6 pl-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xl text-primary font-bold tracking-wide uppercase">
              Total Net Worth
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="primary- hover:text-white transition-colors p-2 hover:bg-white rounded-full dark:bg-slate-800"
              >
                {isVisible ? (
                  <EyeIcon className="w-6 h-6" />
                ) : (
                  <EyeSlashIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          {isAccountsLoading ? (
            <div className="w-56 h-10 bg-white rounded-2xl animate-pulse mt-2 dark:bg-slate-800"></div>
          ) : (
            <h1
              className={`text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-black tracking-tight transition-all duration-500 text-white drop-shadow-lg break-words ${!isVisible && "blur-xl opacity-70"} ${isNetWorthPulsing ? "text-indigo-200 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" : ""}`}
            >
              {isVisible ? (
                <AnimatedCounter
                  value={totalNetWorth}
                  formatCurrency={formatCurrency}
                />
              ) : (
                "$ ••••••••"
              )}
            </h1>
          )}

          {/* Advanced Multi-Currency Ticker */}
          {isVisible && !isAccountsLoading && (
            <div className="h-6 mt-4 overflow-hidden relative flex items-center gap-2">
              <div
                key={targetCode}
                className="flex items-center gap-3 animate-fade-in-up"
              >
                <p className="text-[11px] primary- font-mono font-bold tracking-widest uppercase primary- px-2 py-0.5 rounded border primary- ">
                  ≈ {displayTickerVal}
                </p>
                <p className="text-[9px] primary- font-bold tracking-wider">
                  1 USD = {rate.toFixed(targetCode === "BTC" ? 8 : 4)}{" "}
                  {targetCode}
                </p>
              </div>
            </div>
          )}

          {/* Modernized, Enhanced High-End Premium Wealth Velocity Index Component */}
          {isVisible && !isAccountsLoading && activeChartDataset.length > 0 && (
            <div className="my-4 p-4 rounded-xl bg-slate-100  border border-white/15 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-emerald-500/30">
              {/* Subtle Ambient Glow corresponding to the pulse state */}
              <div
                className={`absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${liveTickerPulse ? "opacity-100" : "opacity-40"}`}
              />

              {/* Dashboard Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${selectedVelocityRange === "LIVE" ? "animate-ping" : ""}`}
                    ></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                      Wealth Velocity Index
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded font-mono ${lastTickChange >= 0 ? "text-emerald-400 bg-emerald-500" : "text-rose-400 bg-rose-500"} transition-all duration-300 font-bold`}
                      >
                        {selectedVelocityRange === "LIVE"
                          ? liveTickerPulse
                            ? "• TICK"
                            : "STEADY"
                          : "HISTORIC"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Custom Ultra Premium Time Range Caps */}
                <div className="flex items-center gap-1 p-0.5 bg-white border border-black/5 rounded-xl dark:bg-slate-800">
                  {(["LIVE", "1W", "1M", "3M", "1Y"] as const).map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setSelectedVelocityRange(rng)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg border uppercase tracking-wider transition-all duration-300 cursor-pointer relative select-none ${
                        selectedVelocityRange === rng
                          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0F172A] border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)] font-black scale-105"
                          : "bg-transparent text-[#0F172A] border-transparent hover:text-white hover:bg-white"
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              {/* Velocity & Volatility Stats Board Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-black/5 mb-4 text-left relative z-10 font-mono dark:bg-slate-800">
                <div>
                  <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block">
                    Velocity
                  </span>
                  <p
                    className={`text-xs font-bold leading-tight mt-0.5 ${lastTickChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {selectedVelocityRange === "LIVE" ? (
                      <span>
                        {lastTickChange >= 0 ? "+" : ""}$
                        {lastTickChange.toFixed(2)}/tick
                      </span>
                    ) : (
                      <span>
                        +
                        {(selectedVelocityRange === "1W"
                          ? 0.85
                          : selectedVelocityRange === "1M"
                            ? 1.45
                            : selectedVelocityRange === "3M"
                              ? 2.82
                              : 12.45
                        ).toFixed(2)}
                        % rate
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block">
                    Beta Drift
                  </span>
                  <p className="text-xs font-bold text-teal-400 leading-tight mt-0.5">
                    {selectedVelocityRange === "LIVE"
                      ? "0.12 (Low)"
                      : selectedVelocityRange === "1W"
                        ? "0.34 (Low)"
                        : "0.45 (Stable)"}
                  </p>
                </div>
                <div className="border-l border-black/5 pl-2">
                  <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block">
                    Target Goal Gap
                  </span>
                  <p className="text-xs font-bold text-amber-400 leading-tight mt-0.5">
                    {Math.min(
                      100,
                      Math.max(0, (totalNetWorth / targetNetWorthLimit) * 100),
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>

              {/* Refactored Live Chart with Double Sizing Height */}
              <div className="w-full h-32 xl:h-48 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeChartDataset}
                    margin={{ top: 10, right: 5, left: 5, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="premiumVelocityGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    {/* Subtle auxiliary gridlines */}
                    <YAxis
                      domain={["dataMin - 1000", "dataMax + 1000"]}
                      hide={true}
                    />
                    <XAxis dataKey="time" hide={true} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const itemVal = payload[0].value as number;
                          return (
                            <div className="bg-slate-100 border border-black/5 p-2.5 rounded-xl shadow-2xl  font-mono text-[9px] text-white">
                              <div className="text-[#0F172A] font-bold mb-1">
                                {payload[0].payload.date}{" "}
                                {payload[0].payload.time
                                  ? `- ${payload[0].payload.time}`
                                  : ""}
                              </div>
                              <div className="text-emerald-400 font-extrabold flex items-center gap-1">
                                Balance: {formatCurrency(itemVal)}
                              </div>
                              {showTargetLine && (
                                <div className="text-amber-400 mt-0.5">
                                  Goal Margin:{" "}
                                  {formatCurrency(
                                    targetNetWorthLimit - itemVal,
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Dynamic golden goal benchmark line */}
                    {showTargetLine && (
                      <ReferenceLine
                        y={targetNetWorthLimit}
                        stroke="#fbbf24"
                        strokeDasharray="3 3"
                        strokeWidth={1.2}
                        opacity={0.8}
                      />
                    )}

                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#premiumVelocityGrad)"
                      activeDot={{
                        r: 5,
                        stroke: "#10b981",
                        strokeWidth: 1.5,
                        fill: "#0c0f1d",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Ultra High-End Velocity Interactive Parameter Adjusters */}
              <div className="mt-4 pt-3 border-t border-black/5 flex flex-col gap-2 relative z-10 text-[9px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#0F172A]">Target Overlay Line</span>
                  <button
                    type="button"
                    onClick={() => setShowTargetLine(!showTargetLine)}
                    className={`px-2 py-0.5 rounded font-black transition-all border ${showTargetLine ? "bg-amber-500 text-amber-300 border-amber-500/30" : "bg-white text-[#0F172A] border-transparent"}`}
                  >
                    {showTargetLine ? "ACTIVE GOLD" : "MUTED"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#0F172A]">Target Net Worth Limit</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTargetNetWorthLimit((prev) =>
                          Math.max(10000, prev - 25000),
                        )
                      }
                      className="w-5 h-5 rounded bg-white text-white active:scale-95 flex items-center justify-center font-bold border border-black/5 dark:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-[#f1f5f9] select-none text-[10px]">
                      {formatCurrency(targetNetWorthLimit)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTargetNetWorthLimit((prev) => prev + 25000)
                      }
                      className="w-5 h-5 rounded bg-white text-white active:scale-95 flex items-center justify-center font-bold border border-black/5 dark:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Widgets */}
        <div className="space-y-4 mt-auto">
          {/* BTC Wallet Widget - Now Functional */}
          <div className="bg-[#0044CC]/80  rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-white/10 shadow-lg transition-transform hover:scale-[1.01] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>

            <div className="flex flex-col gap-3 w-full md:w-auto z-10">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-300 dark:border-black/10 shadow-inner dark:bg-slate-800">
                  <BtcIcon className="w-6 h-6 text-[#F7931A]" />
                </div>
                <div>
                  <p className="text-[10px] primary- font-bold uppercase tracking-wider mb-0.5">
                    Bitcoin Holdings
                  </p>
                  <p className="text-xl font-black tracking-tight text-[#0F172A] dark:text-white leading-none mb-1">
                    5.039701{" "}
                    <span className="text-xs font-bold primary-">
                      BTC
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest bg-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                      ≈{" "}
                      {formatCurrency(
                        5.039701 *
                          (cryptoAssets.find((c) => c.id === "btc")?.price ||
                            64230.5),
                      )}{" "}
                      USD
                    </p>
                    <button
                      onClick={() =>
                        onOpenCurrencyConverter && onOpenCurrencyConverter()
                      }
                      className="px-2 py-0.5 bg-white rounded text-[9px] font-bold hover:bg-white transition-all duration-300 flex items-center gap-1 border border-slate-100 dark:border-white/10  shadow-sm hover:shadow active:scale-95 text-[#0F172A] dark:text-white dark:bg-slate-800"
                    >
                      <ArrowsRightLeftIcon className="w-2.5 h-2.5" /> Trade
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Cryptos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {cryptoAssets
                  .filter((c) => c.id !== "btc")
                  .slice(0, 3)
                  .map((crypto) => {
                    const holdings: Record<string, number> = {
                      eth: 12.45,
                      sol: 145.2,
                      ada: 5000,
                    };
                    const amount = holdings[crypto.id] || 0;
                    if (amount === 0) return null;
                    return (
                      <div
                        key={crypto.id}
                        className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 border border-slate-100 dark:border-white/10 dark:bg-slate-800"
                      >
                        <crypto.icon className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-[#0F172A] dark:text-white leading-none">
                            {amount} {crypto.symbol}
                          </span>
                          <span className="text-[8px] primary- leading-none mt-0.5">
                            ≈ {formatCurrency(amount * crypto.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end z-10 mt-2 md:mt-0 flex-wrap">
              <button
                onClick={() => onOpenQrPay && onOpenQrPay()}
                className="px-3 py-2 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 rounded-lg text-[10px] font-extrabold transition-all duration-300 flex flex-col items-center gap-1 min-w-[70px] border border-teal-300 dark:border-teal-500/20  shadow-[0_0_15px_rgba(14,197,242,0.35)] hover:shadow-[0_0_20px_rgba(14,197,242,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group animate-pulse"
              >
                <svg className="w-3.5 h-3.5 group-hover:scale-120 transition-transform text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5z" />
                </svg>
                Scan & Pay
              </button>
              <button
                onClick={() => onOpenReceive && onOpenReceive()}
                className="px-3 py-2 bg-white rounded-lg text-[10px] font-bold hover:bg-white transition-all duration-300 flex flex-col items-center gap-1 min-w-[60px] border border-slate-100 dark:border-white/10  shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group dark:bg-slate-800"
              >
                <QrCodeIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />{" "}
                Request QR
              </button>
              <button
                onClick={() =>
                  onOpenSendMoneyFlow && onOpenSendMoneyFlow("send")
                }
                className="px-3 py-2 bg-white rounded-lg text-[10px] font-bold hover:bg-white transition-all duration-300 flex flex-col items-center gap-1 min-w-[60px] border border-slate-100 dark:border-white/10  shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group dark:bg-slate-800"
              >
                <ArrowUpCircleIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />{" "}
                Send
              </button>
              <Link
                to="/wire-transfer"
                className="px-3 py-2 bg-white rounded-lg text-[10px] font-bold hover:bg-white transition-all duration-300 flex flex-col items-center gap-1 min-w-[60px] border border-slate-100 dark:border-white/10  shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group dark:bg-slate-800"
              >
                <GlobeAmericasIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />{" "}
                Wire
              </Link>
              <button
                onClick={() =>
                  onOpenCurrencyConverter && onOpenCurrencyConverter()
                }
                className="px-3 py-2 bg-white rounded-lg text-[10px] font-bold hover:bg-white transition-all duration-300 flex flex-col items-center gap-1 min-w-[60px] border border-slate-100 dark:border-white/10  shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group dark:bg-slate-800"
              >
                <ArrowsRightLeftIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />{" "}
                Swap
              </button>
            </div>
          </div>

          {/* Account Number Widget */}
          <div className="bg-[#0c121e]/90  rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-white/10 shadow-lg">
            <div className="flex items-center gap-4">
              <div
                className="shrink-0 relative cursor-pointer group"
                onClick={() => setShowCardsLink(!showCardsLink)}
              >
                <img
                  src="https://english.ahram.org.eg/Media/News/2024/12/10/41_2024-638694399318418360-841.jpg"
                  alt="Cards"
                  className={`w-14 h-9 rounded-lg shadow-lg border border-slate-200 dark:border-white/10 object-cover rotate-[-6deg] absolute -top-1 -left-1 z-10 transition-all duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"} group-hover:scale-105 group-hover:rotate-[-3deg]`}
                  onLoad={() => setImgLoaded(true)}
                />
                <div className="w-14 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-white/10 rotate-[6deg]"></div>

                <AnimatePresence>
                  {showCardsLink && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute top-12 left-0 z-50 whitespace-nowrap"
                    >
                      <Link
                        to="/cards"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="bg-primary text-[#0F172A] dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl flex items-center gap-1.5 hover:bg-primary-dark transition-colors border border-slate-200 dark:border-white/10"
                      >
                        <CreditCardIcon className="w-3 h-3" />
                        View Cards
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="pl-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#0F172A] dark:text-white font-bold">
                    {primaryAccount ? primaryAccount.type : "Business"} Account
                  </p>
                  {copied && (
                    <span className="text-[9px] text-green-400 font-bold animate-fade-in">
                      COPIED
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-2 mt-0.5 group cursor-pointer"
                  onClick={handleCopyAccount}
                >
                  <p className="text-xl font-bold text-[#0F172A] dark:text-white font-mono tracking-widest leading-none">
                    {showAccountNum ? accountNumber : maskedNumber}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAccountNum(!showAccountNum);
                    }}
                    className="p-1 rounded hover:bg-white text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800"
                  >
                    {showAccountNum ? (
                      <EyeSlashIcon className="w-3 h-3" />
                    ) : (
                      <EyeIcon className="w-3 h-3" />
                    )}
                  </button>
                  <ClipboardDocumentIcon className="w-3 h-3 text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex bg-green-500 text-green-400 px-3 py-1.5 rounded-full text-[10px] font-black items-center gap-1.5 border border-green-500/20 uppercase tracking-wide ">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>{" "}
                Active
              </span>
              <button
                onClick={onOpenScanReceipt}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 relative overflow-hidden group hover:scale-105 transition-transform"
              >
                <LucideCamera className="w-4 h-4 relative z-10 text-slate-950" />
                <span className="relative z-10 text-slate-950 font-bold whitespace-nowrap">
                  Scan Receipt
                </span>
              </button>
              <button
                onClick={() =>
                  onOpenSendMoneyFlow && onOpenSendMoneyFlow("deposit")
                }
                className="px-6 py-3 bg-gradient-to-r from-[#0055FF] to-[#0033AA] rounded-xl text-xs font-black text-[#0F172A] dark:text-white hover:from-[#0044CC] flex items-center gap-2 relative overflow-hidden group hover:scale-105 transition-transform"
              >
                <WalletIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10 font-bold whitespace-nowrap">
                  Top up
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes slow-zoom {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.1); }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 20s infinite alternate linear;
                }
            `}</style>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Predictive Analysis Feature
  const [predictiveThreshold, setPredictiveThreshold] = useState(() => {
    return Number(localStorage.getItem('fpb_predictive_threshold') || 500);
  });
  
  const predictiveOutflowMetrics = useMemo(() => {
    if (!props.accounts.length || !props.transactions.length) {
      return { isActive: false, dailyBurnRate: 0 };
    }
    
    // Calculate recent transaction cadence (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentOutflows = props.transactions.filter(t => {
      const txDateStr = t.statusTimestamps?.[TransactionStatus.SUBMITTED] || t.statusTimestamps?.['Submitted'] || t.scheduledDate || Date.now();
      return new Date(txDateStr) >= twoWeeksAgo && 
             (t.accountId === props.accounts[0].id) &&
             t.sendAmount > 0;
    });
    
    const totalOutflows = recentOutflows.reduce((sum, t) => sum + t.sendAmount, 0);
    const dailyBurnRate = totalOutflows / 14;
    
    // Project 3 days into the future
    const projectedBalance = props.accounts[0].balance - (dailyBurnRate * 3);
    const isActive = projectedBalance < predictiveThreshold && props.accounts[0].balance >= predictiveThreshold;
    
    return { isActive, dailyBurnRate };
  }, [props.accounts, props.transactions, predictiveThreshold]);

  const isPredictiveWarningActive = predictiveOutflowMetrics.isActive;

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [receiptToast, setReceiptToast] = useState<string | null>(null);

  // Unfinished Transactions & Clearance State
  const pendingClearanceTxs = useMemo(() => {
    return (props.transactions || []).filter(t => 
      t.status === TransactionStatus.PAUSED_ON_HOLD ||
      t.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION ||
      t.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE ||
      t.status === TransactionStatus.SUBMITTED ||
      t.status === TransactionStatus.PROCESSING
    );
  }, [props.transactions]);

  const [resumeModalTx, setResumeModalTx] = useState<Transaction | null>(null);
  const [dashProofScannerTx, setDashProofScannerTx] = useState<Transaction | null>(null);
  const [resumeProofInput, setResumeProofInput] = useState<string>('');
  const [resumeCodeInput, setResumeCodeInput] = useState<string>('');
  const [isSubmittingResume, setIsSubmittingResume] = useState(false);

  const { isUpdatingLedger } = useRealTimeLedger(
    props.userProfile,
    props.accounts,
    (type, title, msg) => {
      setReceiptToast(msg);
    }
  );

  // Funds clearance live tracking states
  const [staticProgress, setStaticProgress] = useState(68.14);
  const [complianceRequestSent, setComplianceRequestSent] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setStaticProgress(prev => {
        if (prev >= 100) return 100;
        return parseFloat((prev + Math.random() * 0.04).toFixed(2));
      });
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // QR Scan and Pay advanced modal state
  const [isQrPayOpen, setIsQrPayOpen] = useState(false);
  const [qrPayStep, setQrPayStep] = useState<"scan" | "details" | "authorizing" | "processing" | "success">("scan");
  const [scannedMerchant, setScannedMerchant] = useState<{
    name: string;
    accountNumber: string;
    amount: number;
    reference: string;
    bankName: string;
    description: string;
    category?: string;
  } | null>(null);
  const [qrPayAmount, setQrPayAmount] = useState<string>("");
  const [qrSelectedAccount, setQrSelectedAccount] = useState<Account | null>(null);
  const [qrRoutingTier, setQrRoutingTier] = useState<"standard" | "rollup" | "atomic">("atomic");
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [paymentTxHash, setPaymentTxHash] = useState<string>("");
  const [paymentTimestamp, setPaymentTimestamp] = useState<string>("");

  const handleOpenQrPay = () => {
    setQrSelectedAccount(props.accounts[0] || null);
    setQrPayStep("scan");
    setScannedMerchant(null);
    setQrPayAmount("");
    setProcessingLogs([]);
    setIsQrPayOpen(true);
  };

  const DEMO_MERCHANTS = [
    {
      name: "Geneva Haute Horlogerie SA",
      accountNumber: "CH-GVA-8820-9182",
      amount: 18400,
      reference: "INV-CH-9182",
      bankName: "Banque Privée de Genève",
      description: "Chronograph Calibre 8802 Master Edition Luxury Purchase",
      category: "Shopping"
    },
    {
      name: "Imperial Alpine Resort, St. Moritz",
      accountNumber: "CH-STM-4402-1209",
      amount: 8200,
      reference: "RES-STM-1209",
      bankName: "Sovereign Alpine Trust",
      description: "Elite Penthouse Suite & Heliport Ground Sync (5 Nights)",
      category: "Travel"
    },
    {
      name: "L'Ambroisie, Place des Vosges",
      accountNumber: "FR-PAR-9022-7711",
      amount: 1250,
      reference: "DIN-FR-7711",
      bankName: "Crédit Agricole d'Elite",
      description: "Exclusive Sommelier Tasting Degustation & Cover",
      category: "Dining"
    },
    {
      name: "Sovereign Jet Charter Zurich",
      accountNumber: "CH-ZRH-1102-4499",
      amount: 35000,
      reference: "FLY-ZRH-4499",
      bankName: "Nordic Aviation Clearing",
      description: "Gulfstream G650 Private Flight Sync (ZRH - JFK - GVA)",
      category: "Travel"
    }
  ];

  const { formatCurrency } = useCurrency();

  // Clear toast dynamically after 5s
  useEffect(() => {
    if (receiptToast) {
      const t = setTimeout(() => setReceiptToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [receiptToast]);

  const enhancedCards = useMemo(() => {
    const baseCards = props.cards;
    if (baseCards.length >= 3) return baseCards;

    const mock1: Card = {
      ...baseCards[0],
      id: "mock_obsidian",
      lastFour: "8829",
      cardType: "CREDIT",
      network: "Mastercard",
      cardholderName: props.userProfile.name,
    };
    const mock2: Card = {
      ...baseCards[0],
      id: "mock_platinum",
      lastFour: "4401",
      cardType: "DEBIT",
      network: "Visa",
      cardholderName: props.userProfile.name,
    };

    return [...baseCards, mock1, mock2];
  }, [props.cards, props.userProfile.name]);

  // Find clearance-eligible transactions
  const clearanceTransactions = useMemo(() => {
    return props.transactions.filter(tx => 
        tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE ||
        (tx.category as any) === 'Inheritance Funds' || 
        tx.description?.includes('Inheritance') || 
        tx.description?.includes('Real Estate') || 
        tx.description?.includes('Pension') || 
        tx.description?.includes('Salary')
    );
  }, [props.transactions]);

  return (
    <>
      <DashboardBanners 
        verificationLevel={props.verificationLevel}
        tasks={props.tasks}
        userName={props.userProfile.name}
        totalNetWorth={props.totalNetWorth}
        customBanner={props.userProfile?.customBanner}
      />

      <AnimatePresence>
        {isUpdatingLedger && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mb-6 bg-emerald-500 border border-emerald-500/20 p-4 rounded-3xl flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl animate-spin shrink-0">
                <LucideRefreshCw className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm tracking-tight">
                  Clearinghouse Ledger Reconciliation In Progress
                </h4>
                <p className="text-[#0F172A] dark:text-white text-xs mt-0.5">
                  The institutional clearinghouse is updating the Global Ledger in real-time. Balance reconciliation is pending final settlement.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold whitespace-nowrap">
                SYNCING LEDGER
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Unfinished / Pending Clearance Banner */}
      {pendingClearanceTxs.length > 0 && (
        <div className="mb-6 animate-fade-in-up bg-amber-500 border border-amber-500/30 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-amber-500/5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0 mt-0.5">
              <ShieldCheckIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-amber-400 font-black text-sm uppercase tracking-wider">
                  Unfinished Clearance Transfer ({pendingClearanceTxs.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-amber-300 border border-amber-500/30 uppercase">
                  Action Needed
                </span>
              </div>
              <p className="text-[#0F172A] text-xs font-bold mt-1 max-w-2xl leading-relaxed">
                You have {pendingClearanceTxs.length} transfer{pendingClearanceTxs.length > 1 ? 's' : ''} currently awaiting verification or compliance clearance on the Global Ledger node ({pendingClearanceTxs[0].recipient?.fullName || 'Beneficiary'} - {formatCurrency(pendingClearanceTxs[0].sendAmount)}). Resume to upload proof or finalize.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResumeModalTx(pendingClearanceTxs[0])}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 shrink-0 self-start md:self-center"
          >
            Resume Transaction
          </button>
        </div>
      )}

      {/* Predictive Analysis Warning */}
      {isPredictiveWarningActive && (
        <div className="mb-6 animate-fade-in-up bg-amber-500 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-full mt-1 shrink-0">
            <LucideTrendingDown className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-amber-500 font-bold text-lg mb-1 tracking-tight">
              Predictive Balance Alert
            </h3>
            <p className="text-amber-600/80 dark:text-amber-400/80 text-sm font-bold">
              Based on your recent transaction cadence, your {props.accounts[0]?.nickname || "primary account"} balance is projected to fall below your defined threshold of {formatCurrency(predictiveThreshold)} within the next 3 days. 
              Current daily outflow rate: {formatCurrency(predictiveOutflowMetrics.dailyBurnRate)}/day.
            </p>
          </div>
        </div>
      )}

      <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        {/* ROW 1: Header / Net Worth Summary */}
        <div className="lg:col-span-8 min-h-0 md:min-h-[500px] xl:min-h-[540px]">
          <NetWorthCard
            userProfile={props.userProfile}
            totalNetWorth={props.totalNetWorth}
            portfolioChange24h={props.portfolioChange24h}
            displayCurrency={props.displayCurrency}
            isVisible={isBalanceVisible}
            onToggle={() => setIsBalanceVisible((v) => !v)}
            onOpenCurrencyConverter={props.onOpenCurrencyConverter}
            accounts={props.accounts}
            onOpenSendMoneyFlow={props.onOpenSendMoneyFlow}
            onOpenReceive={props.onOpenReceive}
            btcBalance={props.btcBalance}
            cryptoAssets={props.cryptoAssets}
            isAccountsLoading={props.isAccountsLoading}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onOpenQrPay={handleOpenQrPay}
          />
        </div>
        
        {/* ROW 1.5: Adopted Grids for Insights */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0 md:min-h-[500px] xl:min-h-[540px]">
          <div className="flex-1 min-h-0 z-10 transition-all duration-300">
            <HistoricalNetWorthWidget totalNetWorth={props.totalNetWorth} />
          </div>
          <div className="flex-1 min-h-0 z-10 transition-all duration-300">
            <SpendingAnalyticsWidget transactions={props.transactions} />
          </div>
        </div>

        {/* ROW 1.8: US Banking Systems & Real-Time Clearing Hub */}
        <div className="lg:col-span-12 min-w-0 transition-all duration-300">
          <USBankingRailsHub
            accounts={props.accounts}
            userProfile={props.userProfile}
            transactions={props.transactions}
            onOpenSendMoney={props.onOpenSendMoneyFlow}
            onAddTransaction={props.createTransaction}
          />
        </div>

        {/* ROW 2: Quick Transfer & Accounts (Core Banking) */}
        <div className="lg:col-span-7 min-w-0 min-h-[300px] transition-all duration-300">
          <QuickTransfer
            accounts={props.accounts}
            recipients={props.recipients}
            createTransaction={props.createTransaction}
            onContactSupport={props.onContactSupport}
          />
        </div>
        <div className="lg:col-span-5 min-w-0 min-h-[400px] z-10 transition-all duration-300">
          <AccountsWidget
            accounts={props.accounts}
            onAccountClick={setSelectedAccount}
            isAccountsLoading={props.isAccountsLoading}
          />
        </div>

        {/* ROW 3: Cards & Vaults */}
        <div className="lg:col-span-8 min-w-0 relative group min-h-[400px]">
          <div className="w-full h-full relative z-20 transition-all duration-300">
            <MyCardsWidget cards={enhancedCards} />
          </div>
        </div>
        <div className="lg:col-span-4 min-w-0 min-h-[280px] transition-all duration-300">
          <SavingsVaults />
        </div>

        {/* ROW 3.5: D3 Budget vs. Spending Trend Chart */}
        <div className="lg:col-span-12 min-w-0 transition-all duration-300">
          <BudgetVsSpendingD3Chart />
        </div>

        {/* ROW 3.6: Visual Expense Breakdown (Recharts Category Analytics) */}
        <div className="lg:col-span-12 min-w-0 transition-all duration-300">
          <VisualExpenseBreakdown transactions={props.transactions} />
        </div>

        {/* ROW 3.8: Security Health Scorecard */}
        <div className="lg:col-span-12 min-w-0 transition-all duration-300">
          <SecurityHealthGaugeWidget />
        </div>

        {/* ROW 4: Linked External Accounts */}
        <div className="lg:col-span-12 min-w-0 min-h-[300px] transition-all duration-300">
          <LinkedExternalAccountsWidget />
        </div>

        <div className="lg:col-span-12 min-w-0 min-h-[300px]">
          <RecentActivityWidget transactions={props.transactions} />
        </div>

        {/* ROW 7: Global Banking & Crypto */}
        <div className="lg:col-span-6 min-w-0 min-h-[280px]">
          <GlobalBankingNetwork onOpenWireTransfer={props.createTransaction} />
        </div>
        <div className="lg:col-span-6 min-w-0 min-h-[280px]">
          <CryptoWatchlistWidget cryptoAssets={props.cryptoAssets} />
        </div>

        {/* ROW 8: Digital Assets Store */}
        <div className="lg:col-span-12 min-w-0 relative group min-h-[350px]">
          <div className="w-full h-full relative z-20">
            <DigitalAssetStore
              accounts={props.accounts}
              createTransaction={props.createTransaction}
              userProfile={props.userProfile}
            />
          </div>
        </div>
      </div>
      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          transactions={props.transactions}
        />
      )}

      {/* Dynamic Camera Assisted OCR Scan Overlays */}
      <ScanReceiptModal
        isOpen={isScanReceiptOpen}
        onClose={() => setIsScanReceiptOpen(false)}
        accounts={props.accounts}
        createTransaction={props.createTransaction}
        onSuccess={(msg) => setReceiptToast(msg)}
      />

       {/* Floating Success Toast */}
      <AnimatePresence>
        {receiptToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-100 border border-emerald-500/30 text-white font-mono text-xs px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[200] "
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{receiptToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Sovereign Merchant QR Clearance Node Modal */}
      <AnimatePresence>
        {isQrPayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-100  z-[200] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#0b101d] border border-teal-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(14,197,242,0.15)] overflow-hidden flex flex-col relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsQrPayOpen(false)}
                className="absolute right-6 top-6 z-50 p-2 bg-white hover:bg-white rounded-full text-[#0F172A] hover:text-white transition-colors dark:bg-slate-800"
                id="qr-pay-close-btn"
              >
                <XIcon className="w-5 h-5" />
              </button>

              {/* Glowing Top Frame */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

              {/* Header */}
              <div className="p-8 border-b border-black/5 bg-white[0.01] dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_#0ec5f2]" />
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                      Sovereign QR Ingress & Merchant Clearance
                    </h2>
                    <p className="text-[10px] font-mono text-teal-400 uppercase tracking-widest mt-1.5">
                      Direct Real-time Clearing Protocol (TLS 1.3 // Node {Math.floor(Math.random() * 800 + 100)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Step: Scanning */}
              {qrPayStep === "scan" && (
                <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-3xl border border-black/5 min-h-[300px] dark:bg-slate-900">
                    <QrScanner
                      hapticsEnabled={true}
                      onContactSupport={() => {
                        props.onContactSupport?.();
                      }}
                      onScan={(data) => {
                        let parsedMerchant = {
                          name: "External Verified Merchant",
                          accountNumber: "ACC-" + Math.floor(Math.random()*1000000),
                          amount: 0,
                          reference: "REF-" + Math.floor(Math.random()*10000),
                          bankName: "Global Decentralized Settle Node",
                          description: "Real-time in-store QR receipt clearing checkout",
                          category: "Shopping"
                        };
                        try {
                          if (data.startsWith("{")) {
                            const json = JSON.parse(data);
                            parsedMerchant = { ...parsedMerchant, ...json };
                          } else if (data.includes(":")) {
                            const params = new URLSearchParams(data.split("?")[1]);
                            parsedMerchant.accountNumber = data.split(":")[0];
                            if (params.get("amount")) parsedMerchant.amount = parseFloat(params.get("amount") || "0");
                            if (params.get("merchant")) parsedMerchant.name = params.get("merchant") || "Verified Merchant";
                            if (params.get("ref")) parsedMerchant.reference = params.get("ref") || parsedMerchant.reference;
                          } else {
                            parsedMerchant.accountNumber = data.substring(0, 15);
                            parsedMerchant.name = data.length > 20 ? data.substring(0, 20) : data;
                          }
                        } catch (err) {
                          console.log("Error parsing QR), using fallback");
                        }
                        setScannedMerchant(parsedMerchant);
                        setQrPayAmount(parsedMerchant.amount > 0 ? parsedMerchant.amount.toString() : "");
                        setQrPayStep("details");
                      }}
                      onClose={() => setIsQrPayOpen(false)}
                    />
                  </div>

                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                      Scan Merchant QR Target
                    </h3>
                    <p className="text-sm text-[#0F172A] mb-6 leading-relaxed">
                      Sync with and clear invoices from registered merchants, luxury boutiques, private terminals, or crypto ingress points instantly.
                    </p>

                    {/* Presets Grid */}
                    <div className="border border-black/5 bg-white[0.02] rounded-2xl p-4 dark:bg-slate-800">
                      <p className="text-xs font-mono font-bold text-teal-400 mb-3 tracking-wider uppercase">
                        ⚡ Elite Direct Presets for Instant Billing Test
                      </p>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                        {DEMO_MERCHANTS.map((merch, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setScannedMerchant(merch);
                              setQrPayAmount(merch.amount.toString());
                              setQrPayStep("details");
                            }}
                            className="w-full text-left p-3 rounded-xl bg-slate-905 hover:bg-teal-500 border border-black/5 hover:border-teal-500/30 transition-all duration-205 flex items-center justify-between group"
                            id={`qr-merch-preset-${i}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-205 group-hover:text-white">
                                {merch.name}
                              </span>
                              <span className="text-[10px] text-[#0F172A]">
                                {merch.description.substring(0, 36)}...
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-teal-400">
                              {formatCurrency(merch.amount)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Details / Checkout Form */}
              {qrPayStep === "details" && scannedMerchant && (
                <div className="p-8 space-y-6">
                  {/* Verified Flag Header */}
                  <div className="bg-teal-500 border border-teal-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-teal-400 shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                        Verified Imperial Merchant Entity <span className="text-[10px] bg-teal-500 text-[#0F172A] font-extrabold px-1 rounded">LVL 3</span>
                      </h4>
                      <p className="text-xs text-[#0F172A]">
                        Institutional clearing node {scannedMerchant.accountNumber} with premium routing clearance enabled.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Origin & Destination */}
                    <div className="space-y-4">
                      {/* Merchant Details Card */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-black/5 relative overflow-hidden dark:bg-slate-900">
                        <span className="text-[9px] text-teal-400 font-mono font-bold uppercase tracking-wider block mb-1">
                          Merchant Entity Destination
                        </span>
                        <h4 className="text-base font-black text-white">{scannedMerchant.name}</h4>
                        <p className="text-xs text-[#0F172A] mt-1">{scannedMerchant.bankName}</p>
                        <p className="text-[10px] text-slate-550 font-mono mt-1 pr-4 leading-tight">{scannedMerchant.description}</p>
                      </div>

                      {/* Origin Account Selector */}
                      <div>
                        <label className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider block mb-2">
                          Debit Settled Origin Account
                        </label>
                        <div className="space-y-2">
                          {props.accounts.map((acc) => {
                            const isSelected = qrSelectedAccount?.id === acc.id;
                            return (
                              <button
                                key={acc.id}
                                onClick={() => setQrSelectedAccount(acc)}
                                className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${isSelected ? "bg-teal-500 border-teal-500/50" : "bg-slate-50 border-black/5 hover:border-black/5"}`}
                                id={`qr-pay-orig-acc-${acc.id}`}
                              >
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {acc.nickname || acc.type}
                                  </span>
                                  <span className="text-[10px] text-[#0F172A] font-mono">
                                    {acc.accountNumber}
                                  </span>
                                </div>
                                <span className={`text-xs font-mono font-bold ${isSelected ? "text-teal-400" : "text-white"}`}>
                                  <SharedAnimatedCounter value={(acc?.balance || 0)} formatCurrency={formatCurrency} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment amount & routing parameters */}
                    <div className="space-y-4">
                      {/* Amount Field */}
                      <div>
                        <label className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider block mb-2">
                          Authorize Invoice Sum
                        </label>
                        <div className="relative rounded-2xl shadow-inner bg-slate-50 border border-black/5 p-4 flex items-center justify-between dark:bg-slate-900">
                          <span className="text-2xl font-black text-teal-400 mr-2">$</span>
                          <input
                            type="number"
                            value={qrPayAmount}
                            onChange={(e) => setQrPayAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent text-right text-2xl font-black text-white focus:outline-none w-full placeholder-slate-700"
                          />
                        </div>
                        {qrSelectedAccount && parseFloat(qrPayAmount) > (qrSelectedAccount?.balance || 0) && (
                          <span className="text-[10px] text-rose-400 font-bold block mt-1">
                            ⚠️ Insufficient cleared collateral in selected origin account
                          </span>
                        )}
                      </div>

                      {/* Clearance Routing settings */}
                      <div>
                        <label className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider block mb-2">
                          Clearance Route Settle Tier
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "standard", name: "Standard", desc: "0.01% / 15m", speed: "Batch Sync" },
                            { id: "rollup", name: "RollUp", desc: "0.1% / Inst", speed: "Z-K Proof" },
                            { id: "atomic", name: "Atomic", desc: "0.25% / Live", speed: "0.0 ms" }
                          ].map((tier) => {
                            const isSelected = qrRoutingTier === tier.id;
                            return (
                              <button
                                key={tier.id}
                                onClick={() => setQrRoutingTier(tier.id as any)}
                                className={`p-2 rounded-xl border text-center transition-all ${isSelected ? "bg-teal-500 border-teal-500/50 text-teal-400 font-black" : "bg-slate-50 border-black/5 text-[#0F172A] hover:border-black/5 hover:text-white"}`}
                                id={`qr-pay-route-tier-${tier.id}`}
                              >
                                <span className="text-xs font-bold block leading-none">{tier.name}</span>
                                <span className="text-[8px] font-mono font-bold block mt-1.5 uppercase text-[#0F172A]">{tier.desc}</span>
                                <span className="text-[8px] font-mono text-teal-500 block leading-tight mt-0.5">{tier.speed}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Institutional Security Flags */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-black/5 grid grid-cols-2 gap-2 text-[10px] font-mono text-[#0F172A] dark:bg-slate-900">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          <span>HFT Node Routed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          <span>SEC Compliant AES</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          <span>Zero-Knowledge Proof</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          <span>TLS 1.3 Envelope</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-black/5 flex gap-4">
                    <button
                      onClick={() => setQrPayStep("scan")}
                      className="w-1/3 py-4 bg-white hover:bg-white rounded-2xl text-xs font-bold uppercase tracking-wider text-[#0F172A] hover:text-white transition-colors dark:bg-slate-800"
                    >
                      Back to Scan
                    </button>
                    <button
                      disabled={
                        !qrPayAmount ||
                        parseFloat(qrPayAmount) <= 0 ||
                        (qrSelectedAccount ? parseFloat(qrPayAmount) > (qrSelectedAccount?.balance || 0) : false)
                      }
                      onClick={async () => {
                        setQrPayStep("authorizing");
                        // 1. Biometrics authorization loop
                        setTimeout(() => {
                          setQrPayStep("processing");
                          
                          // 2. Clear logs sequential update
                          const logs = [
                            "Secure connection routed to sovereign peer clearing network (CH-ZRH-02)...",
                            "Validating merchant trust indexes and institutional AML parameters...",
                            "Verifying sender account cryptographic ledger proof balances...",
                            "Deducting payment funds and escrowing atomic clearance swap...",
                            "Broadcasting cryptographic block transaction to global ledger network...",
                            "Transaction authorized and signed by FPG Sovereign Trust Node."
                          ];
                          
                          logs.forEach((logLine, idx) => {
                            setTimeout(() => {
                              setProcessingLogs(p => [...p, logLine]);
                            }, idx * 450);
                          });

                          // 3. Dispatch transaction and finish
                          setTimeout(async () => {
                            const fee = parseFloat((parseFloat(qrPayAmount) * (qrRoutingTier === "atomic" ? 0.0025 : qrRoutingTier === "rollup" ? 0.001 : 0.0001)).toFixed(2));
                            const totalSend = parseFloat(qrPayAmount);
                            
                            const merchantRecipient: Recipient = {
                              id: `merch_${scannedMerchant.reference || Date.now()}`,
                              fullName: scannedMerchant.name || "Verified QR Merchant",
                              bankName: scannedMerchant.bankName || "Decentralized Settle Node",
                              accountNumber: scannedMerchant.accountNumber || "ACC-UNKNOWN",
                              country: { code: "CH", name: "Switzerland", currency: "CHF", symbol: "CHF" },
                              realDetails: {
                                accountNumber: scannedMerchant.accountNumber || "ACC-UNKNOWN",
                                swiftBic: "CLRCHZH1"
                              }
                            };

                            const created = await props.createTransaction({
                              accountId: qrSelectedAccount?.id || props.accounts[0]?.id || "",
                              recipient: merchantRecipient,
                              sendAmount: totalSend,
                              receiveAmount: totalSend,
                              fee: fee,
                              exchangeRate: 1,
                              estimatedArrival: new Date(),
                              description: `QR Merchant Clearance // ${scannedMerchant.name}`,
                              category: (scannedMerchant.category || "Shopping") as any
                            });

                            const hash = `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;
                            setPaymentTxHash(hash);
                            setPaymentTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 23));
                            setQrPayStep("success");
                          }, logs.length * 450 + 200);

                        }, 1800);
                      }}
                      className="w-2/3 py-4 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 disabled:opacity-30 disabled:pointer-events-none hover:from-teal-600 hover:to-cyan-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_4px_20px_rgba(14,197,242,0.3)]"
                      id="qr-pay-broadcast-btn"
                    >
                      Clear & Settle {qrPayAmount ? formatCurrency(parseFloat(qrPayAmount)) : ""}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Biometric Handshake */}
              {qrPayStep === "authorizing" && (
                <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="relative w-32 h-32 mb-8">
                    {/* Glowing scanning borders */}
                    <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-pulse" />
                    <div className="absolute -inset-2 rounded-full border-2 border-teal-400/40 animate-ping [animation-duration:2.5s]" />
                    <div className="absolute inset-0 rounded-full bg-teal-500 flex items-center justify-center text-teal-400">
                      {/* Scanning visual overlay */}
                      <div className="absolute top-0 bottom-0 left-0 right-0 border-t-2 border-teal-400/80 animate-bounce [animation-duration:1.5s]" />
                      <svg className="w-16 h-16 text-teal-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">
                    Securing Biometric Clearance
                  </h3>
                  <p className="text-sm text-[#0F172A] max-w-sm">
                    Keep your device level. Verifying unique secure-enclave parameters and cryptographic key handshakes...
                  </p>
                </div>
              )}

              {/* Step: Terminal Clearance Messages */}
              {qrPayStep === "processing" && (
                <div className="p-8 space-y-6 min-h-[400px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <SpinnerIcon className="w-6 h-6 text-teal-400 animate-spin" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        Clearing Direct Ledger Dispatch...
                      </h3>
                    </div>

                    {/* Progress log list */}
                    <div className="bg-slate-100 border border-black/5 rounded-2xl p-5 font-mono text-[10px] text-[#0F172A] space-y-2 h-[220px] overflow-y-auto custom-scrollbar">
                      {processingLogs.map((log, i) => (
                        <div key={i} className="flex gap-2 items-start animate-fade-in text-teal-400 font-mono">
                          <span className="text-[#0F172A] font-bold select-none">&gt;&gt;</span>
                          <span className={`${i === processingLogs.length - 1 ? "text-teal-300 font-bold" : "text-[#0F172A]"}`}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-[#0F172A] uppercase tracking-widest font-mono">
                    Do not close terminal or interrupt direct clearing thread.
                  </div>
                </div>
              )}

              {/* Step: Success Receipt Card */}
              {qrPayStep === "success" && scannedMerchant && (
                <div className="p-8 space-y-6">
                  {/* Glowing success seal */}
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                      Ledger Payment Cleared
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase">
                      Cleared in real time // Atomic Settlement Block
                    </p>
                  </div>

                  {/* Receipt Voucher Body */}
                  <div id="qr-payment-receipt-token" className="bg-slate-50 border border-black/5 p-6 rounded-3xl relative overflow-hidden space-y-4 dark:bg-slate-900">
                    {/* Background faint premium gold watermark */}
                    <div className="absolute -bottom-10 -right-10 text-white/[0.02] transform -rotate-12 select-none pointer-events-none">
                      <PremiumReservedBankLogo className="w-56 h-56" />
                    </div>

                    <div className="flex justify-between items-start border-b border-black/5 pb-4">
                      <div>
                        <h4 className="text-[10px] text-teal-400 font-mono uppercase tracking-wider">Scanned Merchant Entity</h4>
                        <span className="text-base font-extrabold text-white">{scannedMerchant.name}</span>
                        <p className="text-[10px] text-[#0F172A] font-mono mt-0.5">{scannedMerchant.accountNumber}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-[10px] text-[#0F172A] font-mono uppercase tracking-wider">Debit Origin Account</h4>
                        <span className="text-xs font-bold text-slate-205 block">{qrSelectedAccount ? (qrSelectedAccount.nickname || qrSelectedAccount.type) : "Premium Account"}</span>
                        <span className="text-[9px] text-[#0F172A] font-mono leading-none">{qrSelectedAccount?.accountNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-b border-black/5 pb-4">
                      <div>
                        <span className="text-[#0F172A] block">Ledger Tx Hash</span>
                        <span className="font-mono text-[9px] text-teal-300 break-all select-all block mt-0.5 uppercase">
                          {paymentTxHash}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#0F172A] block">Digital Verification Index</span>
                        <span className="font-mono text-[10px] text-slate-202 block mt-0.5">
                          {scannedMerchant.reference}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#0F172A] block">Atomic Settlement UTC</span>
                        <span className="font-mono text-[10px] text-slate-202 block mt-0.5">
                          {paymentTimestamp}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#0F172A] block">Clearing Routing Level</span>
                        <span className="font-mono text-[10px] text-teal-400 block mt-0.5 uppercase">
                          {qrRoutingTier} priority node
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-bold text-[#0F172A]">Transaction Cleared Sum</span>
                      <span className="text-2xl font-black text-white">
                        {formatCurrency(parseFloat(qrPayAmount))}
                      </span>
                    </div>
                  </div>

                  {/* Save Recipient to Contacts Prompt */}
                  {scannedMerchant && (
                    <QrContactPrompt
                      payload={{
                        recipientName: scannedMerchant.name || "Verified QR Merchant",
                        accountNumber: scannedMerchant.accountNumber || "ACC-UNKNOWN",
                        bankName: scannedMerchant.bankName || "Decentralized Settle Node",
                        routingNumber: "021000021",
                        amount: parseFloat(qrPayAmount),
                        description: `QR Merchant Clearance // ${scannedMerchant.name}`
                      }}
                      recipients={props.recipients || []}
                      onSaveRecipient={props.onAddRecipient}
                      onDeleteRecipient={props.onDeleteRecipient}
                      autoSaveOnMount={true}
                    />
                  )}

                  {/* Actions Row */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const doc = new (window as any).jspdf.jsPDF();
                        doc.setFillColor(11, 16, 29);
                        doc.rect(0, 0, 210, 297, "F");
                        
                        doc.setTextColor(255, 255, 255);
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(22);
                        doc.text("FIRST PACIFIC GLOBAL", 20, 30);
                        
                        doc.setFontSize(10);
                        doc.setTextColor(14, 197, 242);
                        doc.text("PRIVATE WEALTH & INSTITUTIONAL CRYPTOGRAPHIC CLEARANCE", 20, 36);
                        
                        doc.setDrawColor(14, 197, 242);
                        doc.setLineWidth(0.5);
                        doc.line(20, 42, 190, 42);
                        
                        doc.setTextColor(200, 200, 200);
                        doc.setFontSize(12);
                        doc.text("ATOMIC LEDGER RECEIPT VOUCHER", 20, 52);
                        
                        doc.setFontSize(10);
                        doc.setTextColor(150, 150, 150);
                        doc.text(`Reference Ticket: ${scannedMerchant.reference}`, 20, 62);
                        doc.text(`Timestamp: ${paymentTimestamp} (UTC)`, 20, 68);
                        doc.text(`Ledger Hash: ${paymentTxHash}`, 20, 74);
                        
                        doc.setFillColor(20, 30, 50);
                        doc.rect(20, 85, 170, 80, "F");
                        
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(12);
                        doc.text("VERIFIED TRANSACTION DETAILS", 25, 95);
                        
                        doc.setFontSize(10);
                        doc.text(`Merchant Name:  ${scannedMerchant.name}`, 25, 110);
                        doc.text(`Merchant Settle Node:  ${scannedMerchant.accountNumber}`, 25, 118);
                        doc.text(`Debit Origin Account:  ${qrSelectedAccount ? (qrSelectedAccount.nickname || qrSelectedAccount.type) : "Premium Account"} (${qrSelectedAccount?.accountNumber || ""})`, 25, 126);
                        doc.text(`Description:  ${scannedMerchant.description}`, 25, 134);
                        doc.text(`Routing Tier:  ${qrRoutingTier.toUpperCase()} INSTANT SYNC`, 25, 142);
                        doc.text(`Status:  VERIFIED & CLEAR`, 25, 150);
                        
                        doc.setFontSize(16);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`TOTAL SUM CLEARED:  $${parseFloat(qrPayAmount).toLocaleString('en-US', {minimumFractionDigits: 2})}`, 20, 185);
                        
                        doc.setTextColor(150, 150, 150);
                        doc.setFontSize(8);
                        doc.text("This receipt constitutes cryptographically validated compliance documentation from First Pacific Global Private Bank.", 20, 210);
                        doc.text("Cleared in accordance with Swiss Private Ledger Framework §43. All collateral checks are complete.", 20, 215);
                        
                        doc.save(`FPG-Receipt-${scannedMerchant.reference}.pdf`);
                        setReceiptToast("Secure PDF receipt generated and downloaded successfully");
                      }}
                      className="w-1/2 py-4 bg-white hover:bg-white rounded-2xl text-xs font-bold uppercase tracking-wider text-teal-400 hover:text-white transition-colors flex items-center justify-center gap-2 dark:bg-slate-800"
                      id="qr-pay-download-pdf-btn"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download PDF
                    </button>
                    <button
                      onClick={() => setIsQrPayOpen(false)}
                      className="w-1/2 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                      id="qr-pay-complete-close-btn"
                    >
                      Close Terminal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {receiptToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-100 border border-emerald-500/30 text-white font-mono text-xs px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[200] "
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{receiptToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Unfinished Transaction Modal */}
      {resumeModalTx && (
        <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0b152a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setResumeModalTx(null)}
              className="absolute top-5 right-5 text-[#0F172A] hover:text-white p-2 rounded-xl bg-slate-50 border border-black/5 dark:bg-slate-900"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 border border-amber-500/40 rounded-2xl text-amber-400">
                <ShieldCheckIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Resume & Complete Clearance
                </h3>
                <p className="text-xs text-[#0F172A] font-mono">
                  REF: {resumeModalTx.id}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-black/5 p-4 rounded-2xl space-y-2 text-xs font-mono dark:bg-slate-900">
              <div className="flex justify-between">
                <span className="text-[#0F172A]">Recipient:</span>
                <span className="text-white font-bold">{resumeModalTx.recipient?.fullName || (resumeModalTx as any).recipientName || 'External Recipient'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]">Amount:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(resumeModalTx.sendAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]">Current Status:</span>
                <span className="text-amber-400 font-black uppercase">{resumeModalTx.status}</span>
              </div>
            </div>

            {/* Proof or Code upload */}
            <div className="space-y-4">
              <div className="p-3 bg-amber-500 border border-amber-500/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Automated Verification Option</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500 px-2 py-0.5 rounded">Instant Auto-Release</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDashProofScannerTx(resumeModalTx);
                    setResumeModalTx(null);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>📷 Launch AI Camera Document Scanner</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#0F172A] block mb-1">
                  Or Paste Receipt / Verification Proof URL or Base64
                </label>
                <input 
                  type="text"
                  placeholder="Paste receipt URL, photo link, or proof note..."
                  value={resumeProofInput}
                  onChange={(e) => setResumeProofInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#0F172A] block mb-1">
                  Regulatory Authorization / Verification Code (If required)
                </label>
                <input 
                  type="text"
                  placeholder="Enter compliance release code..."
                  value={resumeCodeInput}
                  onChange={(e) => setResumeCodeInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-white/15 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase tracking-widest dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={async () => {
                  setIsSubmittingResume(true);
                  try {
                    const updatedTx = {
                      ...resumeModalTx,
                      status: TransactionStatus.AWAITING_PAYMENT_VERIFICATION,
                      paymentProof: resumeProofInput.trim() || resumeModalTx.paymentProof,
                      paymentProofTimestamp: new Date().toISOString(),
                      verificationRequested: true
                    };
                    await db.saveTransaction(updatedTx as any);
                    window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: [updatedTx] }));
                    window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: [updatedTx] }));
                    setReceiptToast("Payment proof submitted! Your transaction is now in priority clearance review.");
                    setResumeModalTx(null);
                  } catch (err) {
                    console.error("Failed to resume transaction:", err);
                  } finally {
                    setIsSubmittingResume(false);
                  }
                }}
                disabled={isSubmittingResume}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                Submit Proof & Escalate
              </button>
              <button
                onClick={async () => {
                  if (!resumeModalTx.regulatoryAuthCode) {
                      setReceiptToast("This transaction requires administrative clearance. Please upload payment proof and wait for a code.");
                      return;
                  }
                  if (resumeCodeInput.trim().toUpperCase() !== resumeModalTx.regulatoryAuthCode.toUpperCase()) {
                      setReceiptToast("Invalid authorization code. Please check the code and try again.");
                      return;
                  }
                  setIsSubmittingResume(true);
                  try {
                    await db.updateTransactionStatus(resumeModalTx.id, TransactionStatus.COMPLETED);
                    setReceiptToast("Transaction clearance finalized and dispatched!");
                    setResumeModalTx(null);
                  } catch (err) {
                    console.error("Failed to complete transaction:", err);
                  } finally {
                    setIsSubmittingResume(false);
                  }
                }}
                disabled={isSubmittingResume}
                className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Finalize & Release Funds
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentProofScannerModal
        isOpen={!!dashProofScannerTx}
        onClose={() => setDashProofScannerTx(null)}
        transaction={dashProofScannerTx}
        onVerificationSuccess={(updatedTx) => {
          setDashProofScannerTx(null);
          setReceiptToast("✓ Payment proof verified! Transaction auto-cleared & funds released.");
          window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: [updatedTx] }));
          window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: [updatedTx] }));
        }}
      />
    </>
  );
};
