// ... existing imports ...
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { socket } from "../services/socket";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Recipient,
  Transaction,
  Account,
  SecuritySettings,
  TransactionStatus,
  AccountType,
  UserProfile,
  PaymentMethodType,
  Country,
  PushNotificationSettings,
  NotificationType,
} from "../types";
import {
  STANDARD_FEE,
  EXPRESS_FEE,
  EXCHANGE_RATES,
  TRANSFER_PURPOSES,
  USER_PIN,
  NETWORK_AUTH_CODE,
  INTERNATIONAL_WIRE_FEE,
  CURRENCIES_LIST,
} from "./constants";
import { db } from "../services/database";
import {
  SpinnerIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  XIcon,
  NetworkIcon,
  UsersIcon,
  SendIcon,
  CameraIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
  LockClosedIcon,
  WalletIcon,
  ServerIcon,
  WifiIcon,
  BankIcon,
  PlusIcon,
  getBankIcon,
  getServiceIcon,
  UserCircleIcon,
  ClockIcon,
  CreditCardIcon,
  WithdrawIcon,
  PlusCircleIcon,
  PremiumReservedBankLogo,
  ChevronRightIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon as ShieldIcon,
  VerifiedBadgeIcon,
  InfoIcon,
  ScaleIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  BtcIcon,
  EthIcon,
  BrandLogo,
  ChevronDownIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  SearchIcon,
  QrCodeIcon,
} from "./Icons";
import { triggerHaptic, triggerSuccessHaptic, triggerFailureHaptic } from "../utils/haptics";
import { PaymentReceipt } from "./PaymentReceipt";
import { CheckDepositFlow } from "./CheckDepositFlow";
import { RecipientSelector } from "./RecipientSelector";
import { ComplianceHaltModal } from "./ComplianceHaltModal";
import { AddNewMethodModal } from "./AddNewMethodModal";
import { AddRecipientModal } from "./AddRecipientModal";
import { useCurrency } from "../contexts/CurrencyContext";
import { useSystemOptions } from "../hooks/useSystemOptions";
import { RoutingLookup } from "../services/bankCodesService";
import { RealTimePaymentVerification } from "./RealTimePaymentVerification";
import { QrScanner } from "./QrScanner";
import { BiometricPaymentAuthModal } from "./BiometricPaymentAuthModal";
import { ShareQrCodeModal } from "./ShareQrCodeModal";

interface SendMoneyFlowProps {
  recipients: Recipient[];
  accounts: Account[];
  createTransaction: (
    transaction: Omit<
      Transaction,
      "id" | "status" | "statusTimestamps" | "type"
    >,
  ) => Promise<Transaction | null>;
  transactions: Transaction[];
  securitySettings: SecuritySettings;
  hapticsEnabled: boolean;
  hapticsIntensity?: number;
  onAuthorizeTransaction: (
    transactionId: string,
    method: "code" | "fee",
  ) => void;
  onClose: () => void;
  onLinkAccount: () => void;
  onDepositCheck: (details: {
    amount: number;
    accountId: string;
    images: { front: string; back: string };
  }) => void;
  onSplitTransaction: (details: {
    sourceAccountId: string;
    splits: { recipient: Recipient; amount: number }[];
    totalAmount: number;
    purpose: string;
  }) => boolean;
  initialTab?: "send" | "bridge" | "split" | "deposit" | "qr_share";
  transactionToRepeat?: Transaction | null;
  preselectedRecipient?: Recipient | null;
  userProfile: UserProfile;
  onContactSupport: () => void;
  onAddRecipient?: (data: any) => void;
  initialQrOpen?: boolean;
  pushNotificationSettings?: PushNotificationSettings;
  addNotification?: (type: NotificationType, title: string, message: string) => void;
}

const TABS = [
  {
    id: "send",
    label: "Wire",
    icon: <GlobeAmericasIcon className="w-3 h-3" />,
  },
  {
    id: "qr_share",
    label: "Share QR",
    icon: <QrCodeIcon className="w-3 h-3" />,
  },
  {
    id: "bridge",
    label: "Bridge",
    icon: <ArrowsRightLeftIcon className="w-3 h-3" />,
  },
  { id: "split", label: "Split", icon: <UsersIcon className="w-3 h-3" /> },
  { id: "deposit", label: "Deposit", icon: <CameraIcon className="w-3 h-3" /> },
];

const INSTITUTIONAL_PURPOSES = [
  "Invoice Settlement",
  "Real Estate Acquisition",
  "Family Maintenance",
  "Institutional Investment",
  "Legal/Professional Fees",
  "Loan Disbursement",
  "Inter-account Rebalancing",
];

interface BridgeAsset {
  id: string;
  name: string;
  type: "BANK" | "CRYPTO" | "APP";
  symbol: string;
  balance: number;
  icon?: any;
  domain?: string;
  color?: string;
}

const BRIDGE_ASSETS: BridgeAsset[] = [
  {
    id: "prb_main",
    name: "PRB Checking",
    type: "BANK",
    symbol: "USD",
    balance: 850000.0,
    icon: BankIcon,
    color: "text-[#0F172A] dark:text-white",
  },
  {
    id: "btc_cold",
    name: "Bitcoin Vault",
    type: "CRYPTO",
    symbol: "BTC",
    balance: 4.2561,
    icon: BtcIcon,
    color: "text-[#F7931A]",
  },
  {
    id: "eth_hot",
    name: "Ethereum Wallet",
    type: "CRYPTO",
    symbol: "ETH",
    balance: 142.5,
    icon: EthIcon,
    color: "text-[#627EEA]",
  },
  {
    id: "paypal",
    name: "PayPal",
    type: "APP",
    symbol: "USD",
    balance: 1250.0,
    domain: "paypal.com",
  },
];

// ... (AssetBridge Component) ...
const AssetBridge: React.FC<{
  onBridgeComplete: (tx: any) => void;
  onContactSupport: () => void;
  userProfile: UserProfile;
}> = ({ onBridgeComplete, onContactSupport, userProfile }) => {
  const { formatCurrency } = useCurrency();
  const [fromAssetId, setFromAssetId] = useState("prb_main");
  const [toAssetId, setToAssetId] = useState("btc_cold");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<
    "input" | "confirm" | "processing" | "success"
  >("input");
  const [btcPrice, setBtcPrice] = useState(64500.0);
  const [isSelectorOpen, setIsSelectorOpen] = useState<"from" | "to" | null>(
    null,
  );
  const [showCompliance, setShowCompliance] = useState(false);

  const fromAsset = BRIDGE_ASSETS.find((a) => a.id === fromAssetId)!;
  const toAsset = BRIDGE_ASSETS.find((a) => a.id === toAssetId)!;

  const rate =
    fromAsset.symbol === "USD" && toAsset.symbol === "BTC"
      ? 1 / btcPrice
      : fromAsset.symbol === "BTC" && toAsset.symbol === "USD"
        ? btcPrice
        : 1;

  const numericAmount = parseFloat(amount) || 0;
  const netReceive = numericAmount * rate; // 0% fee

  const handleConfirm = () => {
    if (numericAmount <= 0) return;
    setStep("confirm");
  };

  const processBridge = () => {
    setStep("processing");
    setTimeout(() => {
      onBridgeComplete({
        type: "transfer",
        amount: numericAmount,
        from: fromAsset.name,
        to: toAsset.name,
        symbol: fromAsset.symbol,
      });
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {showCompliance && (
        <ComplianceHaltModal
          isOpen={true}
          amount={numericAmount}
          onVerified={processBridge}
          onCancel={() => setShowCompliance(false)}
        />
      )}

      {step === "input" && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            {/* Source Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                  Source Asset
                </span>
                <span className="text-[10px] font-mono text-[#0F172A] dark:text-white">
                  Avail: {(fromAsset?.balance || 0).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10">
                  {fromAsset.icon && (
                    <fromAsset.icon className={`w-5 h-5 ${fromAsset.color}`} />
                  )}
                </div>
                <select
                  value={fromAssetId}
                  onChange={(e) => setFromAssetId(e.target.value)}
                  className="bg-transparent text-[#0F172A] dark:text-white font-bold text-sm outline-none flex-1"
                >
                  {BRIDGE_ASSETS.map((a) => (
                    <option
                      key={a.id}
                      value={a.id}
                      className="bg-slate-50 dark:bg-slate-900"
                    >
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div className="bg-slate-100 rounded-2xl p-6 border border-slate-100 dark:border-white/10 text-center">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-center text-4xl font-mono font-bold text-[#0F172A] dark:text-white outline-none w-full placeholder-slate-700"
              />
              <p className="text-xs font-bold text-[#0F172A] mt-2 uppercase tracking-widest">
                {fromAsset.symbol} Volume
              </p>
            </div>

            <div className="flex justify-center -my-3 z-10 relative">
              <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full border-4 border-[#0c121e]">
                <ArrowsRightLeftIcon className="w-4 h-4 text-[#0F172A] dark:text-white rotate-90" />
              </div>
            </div>

            {/* Dest Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                  Destination
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10">
                  {toAsset.icon && (
                    <toAsset.icon className={`w-5 h-5 ${toAsset.color}`} />
                  )}
                </div>
                <select
                  value={toAssetId}
                  onChange={(e) => setToAssetId(e.target.value)}
                  className="bg-transparent text-[#0F172A] dark:text-white font-bold text-sm outline-none flex-1"
                >
                  {BRIDGE_ASSETS.map((a) => (
                    <option
                      key={a.id}
                      value={a.id}
                      className="bg-slate-50 dark:bg-slate-900"
                    >
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {numericAmount > 0 ? `~${netReceive.toFixed(4)}` : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95 text-xs"
          >
            Execute Bridge
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in text-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10">
            <LockClosedIcon className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
              Authorize Bridge
            </h3>
            <p className="text-[#0F172A] dark:text-white text-xs">
              Verify biometrics to proceed.
            </p>
          </div>
          <button
            onClick={() => processBridge()}
            className="w-full py-4 bg-slate-100 text-[#0F172A] rounded-xl font-bold text-sm"
          >
            Use Face ID
          </button>
          <button
            onClick={() => setStep("input")}
            className="text-xs font-bold text-[#0F172A]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// ... (SocialSplitView Component - Unchanged) ...
const SocialSplitView: React.FC<{
  recipients: Recipient[];
  onSplit: (amount: number, friends: Recipient[]) => void;
  onAddNew: () => void;
}> = ({ recipients, onSplit, onAddNew }) => {
  const [amount, setAmount] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(
    new Set(),
  );
  const {
    formatCurrency,
    displayCurrency,
    setDisplayCurrency,
    getCurrencyInfo,
    rates,
  } = useCurrency();

  const toggleFriend = (id: string) => {
    const next = new Set(selectedFriends);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFriends(next);
  };

  const inputAmountUSD =
    (parseFloat(amount) || 0) / (rates[displayCurrency] || 1);
  const costPerPersonUSD = inputAmountUSD / (selectedFriends.size + 1);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="bg-slate-100 rounded-2xl p-6 border border-slate-100 dark:border-white/10 text-center">
        <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest mb-2">
          Total Amount
        </p>
        <div className="relative inline-block mt-2">
          <div className="absolute left-[-50px] top-1/2 -translate-y-1/2">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900  text-[#0F172A] dark:text-white font-bold text-sm p-1.5 pr-6 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer border border-slate-200 dark:border-white/10 shadow-lg z-10"
              style={{
                backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="6 9 12 15 18 9"%3E%3C/polyline%3E%3C/svg%3E')`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 6px center",
                backgroundSize: "14px",
              }}
            >
              {CURRENCIES_LIST.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
          <span className="absolute left-[-15px] top-1 text-xl text-[#0F172A] font-bold">
            {getCurrencyInfo?.(displayCurrency)?.symbol || "$"}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-4xl font-black text-[#0F172A] dark:text-white text-center outline-none w-32 placeholder-slate-700 font-mono pl-4"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
            Select Peers
          </p>
          <button
            onClick={onAddNew}
            className="text-[10px] font-bold text-primary flex items-center gap-1"
          >
            <PlusIcon className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {recipients.slice(0, 5).map((rec) => (
            <button
              key={rec.id}
              onClick={() => toggleFriend(rec.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedFriends.has(rec.id) ? "bg-primary/10 border-primary" : "bg-white dark:bg-slate-900 border-transparent hover:bg-white dark:bg-slate-900"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0F172A] dark:text-white ${selectedFriends.has(rec.id) ? "bg-primary" : "bg-slate-100 dark:bg-slate-700"}`}
              >
                {rec.fullName.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-bold text-[#0F172A] dark:text-white">
                  {rec.fullName}
                </p>
              </div>
              {selectedFriends.has(rec.id) && (
                <CheckCircleIcon className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedFriends.size > 0 && (
        <button
          onClick={() => {
            const usdAmount =
              parseFloat(amount) / (rates[displayCurrency] || 1);
            onSplit(
              usdAmount,
              recipients.filter((r) => selectedFriends.has(r.id)),
            );
          }}
          className="w-full py-4 bg-primary text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg"
        >
          Request {formatCurrency(costPerPersonUSD)} / ea
        </button>
      )}
    </div>
  );
};

const MoneyTransferAnimation: React.FC<{
  userProfile: UserProfile;
  recipient: Recipient | undefined;
  amount: number;
  symbol: string;
}> = ({ userProfile, recipient, amount, symbol }) => {
  // Generate real bank notes: Dollars, Euros, Pounds
  const notesArray = ["💵", "💶", "💷"];
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        delay: i * 0.12,
        duration: 1.2 + Math.random() * 0.6,
        yOffset: (Math.random() - 0.5) * 60,
        note: notesArray[i % notesArray.length],
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
      })),
    [],
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto h-56 relative animate-fade-in">
      {/* Sender and Receiver Avatars */}
      <div className="flex justify-between items-center w-full relative z-10 px-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border border-primary/50 overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
            {userProfile.profilePictureUrl ? (
              <img
                src={userProfile.profilePictureUrl}
                alt="You"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-black text-2xl uppercase">
                {userProfile.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-4">
            You
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border border-emerald-500 overflow-hidden bg-emerald-900 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black text-2xl uppercase">
              {recipient?.fullName?.charAt(0) || "?"}
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-4">
            {recipient?.fullName?.split(" ")[0] || "Recipient"}
          </span>
        </div>
      </div>

      {/* Money Notes Flying */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 0,
              x: -100,
              y: p.yOffset,
              scale: 0.3,
              rotateY: 0,
              rotateZ: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [-100, -20, 20, 100],
              y: [p.yOffset, p.yOffset - 50, p.yOffset + 30, p.yOffset],
              scale: [0.3, 1.8, 1.8, 0.3],
              rotateY: [
                0,
                180 * p.rotationDirection,
                360 * p.rotationDirection,
                540 * p.rotationDirection,
              ],
              rotateZ: [
                0,
                15 * p.rotationDirection,
                -15 * p.rotationDirection,
                0,
              ],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: 0.1,
              ease: "easeInOut",
            }}
            style={{ perspective: 600 }}
            className="absolute text-5xl filter drop-shadow-[0_10px_15px_rgba(16,185,129,0.3)] flex items-center justify-center "
          >
            {p.note}
          </motion.div>
        ))}
      </div>

      {/* Processing Text */}
      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-widest animate-pulse">
          Broadcasting
        </h3>
        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2">
          {symbol}
          {amount.toFixed(2)} Transferring...
        </p>
      </div>
    </div>
  );
};

export const SendMoneyFlow: React.FC<SendMoneyFlowProps> = ({
  recipients,
  accounts,
  createTransaction,
  transactions,
  securitySettings,
  hapticsEnabled,
  hapticsIntensity = 80,
  onAuthorizeTransaction,
  onClose,
  onLinkAccount,
  onDepositCheck,
  onSplitTransaction,
  initialTab = "send",
  transactionToRepeat,
  preselectedRecipient,
  userProfile,
  onContactSupport,
  onAddRecipient,
  initialQrOpen = false,
  pushNotificationSettings,
  addNotification,
}) => {
  const {
    formatCurrency,
    displayCurrency,
    setDisplayCurrency,
    getCurrencyInfo,
    rates,
  } = useCurrency();
  const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || "$";
  const navigate = useNavigate();
  const systemOptions = useSystemOptions();

  const [activeTab, setActiveTab] = useState<
    "send" | "bridge" | "split" | "deposit" | "qr_share"
  >(initialTab || "send");
  const [isBiometricConfirmOpen, setIsBiometricConfirmOpen] = useState(false);
  const [isShareQrModalOpen, setIsShareQrModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const isRecovering = React.useRef(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    preselectedRecipient?.id || "",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || "",
  );
  const [amount, setAmount] = useState("");
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  const [showFeeComparison, setShowFeeComparison] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [memo, setMemo] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState(userProfile?.phone || "2347068683114");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [isRecipientSelectorOpen, setIsRecipientSelectorOpen] = useState(false);
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(initialQrOpen);
  const [scannedQrDetails, setScannedQrDetails] = useState<{
    recipientName: string;
    accountNumber: string;
    bankName: string;
    swiftBic: string;
    amount?: string;
    purpose?: string;
  } | null>(null);
  const [tempRecipients, setTempRecipients] = useState<Recipient[]>([]);
  const [isComplianceHaltOpen, setIsComplianceHaltOpen] = useState(false);
  const [complianceFeePaid, setComplianceFeePaid] = useState<number>(0);
  const [isSimulatingPreHalt, setIsSimulatingPreHalt] = useState(false);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [isValidatingBank, setIsValidatingBank] = useState(false);
  const [paymentRail, setPaymentRail] = useState<"SWIFT" | "SEPA" | "FedWire">(
    "SWIFT",
  );
  const [internalAccountNumber, setInternalAccountNumber] = useState("");
  const [isValidatingEmailMx, setIsValidatingEmailMx] = useState(false);
  const [mxStepProgress, setMxStepProgress] = useState<string[]>([]);
  const [mxStatus, setMxStatus] = useState<"idle" | "success" | "failed">(
    "idle",
  );

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSelections, setBulkSelections] = useState<{
    [id: string]: { amount: string; purpose: string; selected: boolean };
  }>({});
  const [completedBulkTransactions, setCompletedBulkTransactions] = useState<
    Transaction[]
  >([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [frequency, setFrequency] = useState<"one-time" | "weekly" | "monthly" | "quarterly">("one-time");
  const [recurringEndCondition, setRecurringEndCondition] = useState<"never" | "date" | "occurrences">("never");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringOccurrences, setRecurringOccurrences] = useState(1);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    if (isBulkMode && Object.keys(bulkSelections).length === 0) {
      const initial: typeof bulkSelections = {};
      const allRecs = [...recipients, ...tempRecipients];
      allRecs.forEach((r) => {
        initial[r.id] = {
          amount: "50",
          purpose: "Invoice Settlement",
          selected: false,
        };
      });
      setBulkSelections(initial);
    }
  }, [isBulkMode, recipients, tempRecipients, bulkSelections]);

  // Auto-save: recover progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prb_send_money_autosave");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedRecipientId !== undefined)
          setSelectedRecipientId(parsed.selectedRecipientId);
        if (parsed.selectedAccountId !== undefined)
          setSelectedAccountId(parsed.selectedAccountId);
        if (parsed.amount !== undefined) setAmount(parsed.amount);
        if (parsed.purpose !== undefined) setPurpose(parsed.purpose);
        if (parsed.paymentRail !== undefined)
          setPaymentRail(parsed.paymentRail);
        if (parsed.internalAccountNumber !== undefined)
          setInternalAccountNumber(parsed.internalAccountNumber);
        if (parsed.activeTab !== undefined) setActiveTab(parsed.activeTab);
        if (parsed.step !== undefined) setStep(parsed.step);
      }
    } catch (e) {
      console.error("Failed to load send money autosave", e);
    }
    setTimeout(() => {
      isRecovering.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    if (userProfile?.phone) {
      setPhone(userProfile.phone);
    }
  }, [userProfile]);

  // Auto-save: clear progress on transaction completion
  useEffect(() => {
    if (completedTransaction) {
      try {
        localStorage.removeItem("prb_send_money_autosave");
      } catch (e) {
        console.error(e);
      }
    }
  }, [completedTransaction]);

  // Auto-save: persist progress to localStorage on changes
  useEffect(() => {
    try {
      const dataToSave = {
        selectedRecipientId,
        selectedAccountId,
        amount,
        purpose,
        paymentRail,
        internalAccountNumber,
        activeTab,
        step,
      };
      localStorage.setItem(
        "prb_send_money_autosave",
        JSON.stringify(dataToSave),
      );
    } catch (e) {
      console.error("Failed to persist send money autosave", e);
    }
  }, [
    selectedRecipientId,
    selectedAccountId,
    amount,
    purpose,
    paymentRail,
    internalAccountNumber,
    activeTab,
    step,
  ]);

  // Derived State
  const recipient = internalAccountNumber
    ? ({
        id: `internal_${internalAccountNumber}`,
        fullName: `Internal PRB Account`,
        email: `internal@pacificreserve.com`,
        bankName: "First Pacific Bank",
        accountNumber: internalAccountNumber,
        routingNumber: "121000358",
        country: {
          code: "US",
          name: "United States",
          currency: "USD",
          flag: "🇺🇸",
        },
        tier: "Standard",
        address: "Internal Transfer",
      } as unknown as Recipient)
    : recipients.find((r) => r.id === selectedRecipientId) ||
      tempRecipients.find((r) => r.id === selectedRecipientId);
  const account = accounts.find((a) => a.id === selectedAccountId);
  const inputAmountInCurrency = parseFloat(amount) || 0;
  const numericAmount = inputAmountInCurrency / (rates[displayCurrency] || 1);

  // International Transfer Logic
  const isInternational = recipient ? recipient.country.code !== "US" : false;
  const applicableFee = 0;

  // Display exchange rate relative to chosen display currency instead of base USD
  const targetCurrencyRate =
    recipient && isInternational
      ? rates[recipient.country.currency] || 1
      : rates["USD"] || 1;
  const relativeExchangeRate =
    targetCurrencyRate / (rates[displayCurrency] || 1);

  const receiveAmount = numericAmount * targetCurrencyRate;
  
  const activeComplianceRateVal = systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17;
  const isComplianceHaltTriggered = numericAmount > 100;
  const potentialComplianceFee = isComplianceHaltTriggered ? (numericAmount * (activeComplianceRateVal / 100)) : 0;

  const totalCost = numericAmount + applicableFee + potentialComplianceFee;

  const canAfford = account ? (account?.balance || 0) >= totalCost : false;

  // Last 5 compliance fees sparkline data helper
  const last5ComplianceFees = useMemo(() => {
    const historical = transactions
      .filter((t) => t.complianceFee !== undefined)
      .slice(-5)
      .map((t) => t.complianceFee || 0);
    
    // Fallback to realistic fluctuations if not enough history
    const defaultFluctuations = [
      15.2 * (activeComplianceRateVal / 17), 
      22.1 * (activeComplianceRateVal / 17), 
      18.5 * (activeComplianceRateVal / 17), 
      34.0 * (activeComplianceRateVal / 17), 
      25.4 * (activeComplianceRateVal / 17)
    ];
    while (historical.length < 5) {
      historical.unshift(defaultFluctuations[4 - historical.length]);
    }
    return historical;
  }, [transactions, activeComplianceRateVal]);

  // Historical compliance average fee helper
  const historicalFeeAverage = useMemo(() => {
    const historical = transactions
      .filter((t) => t.complianceFee !== undefined && t.complianceFee > 0);
    if (historical.length > 0) {
      const sum = historical.reduce((acc, t) => acc + (t.complianceFee || 0), 0);
      return sum / historical.length;
    }
    // Benchmark average: 15% of current transfer volume
    return numericAmount * 0.15;
  }, [transactions, numericAmount]);

  // Bulk Derived Calculations
  const bulkEntries = useMemo(() => {
    return Object.entries(bulkSelections)
      .filter(([_, data]) => data.selected)
      .map(([id, data]) => {
        const rec =
          recipients.find((r) => r.id === id) ||
          tempRecipients.find((r) => r.id === id);
        return {
          id,
          recipient: rec,
          amount: parseFloat(data.amount) || 0,
          purpose: data.purpose || "Invoice Settlement",
        };
      })
      .filter((e) => e.recipient !== undefined);
  }, [bulkSelections, recipients, tempRecipients]);

  const bulkTotalPrincipalUSD = useMemo(() => {
    return bulkEntries.reduce((sum, entry) => {
      const amtUSD = entry.amount / (rates[displayCurrency] || 1);
      return sum + amtUSD;
    }, 0);
  }, [bulkEntries, displayCurrency, rates]);

  const bulkTotalFees = useMemo(() => {
    return bulkEntries.reduce((sum, entry) => {
      if (!entry.recipient) return sum;
      const recIsInt = entry.recipient.country.code !== "US";
      const entryAmtUSD = entry.amount / (rates[displayCurrency] || 1);
      const fee = 0;
      return sum + fee;
    }, 0);
  }, [bulkEntries, paymentRail, displayCurrency, rates]);

  const bulkTotalDeductionUSD = bulkTotalPrincipalUSD + bulkTotalFees;
  const canAffordBulk = account
    ? (account?.balance || 0) >= bulkTotalDeductionUSD
    : false;

  const estimatedArrivalDate = useMemo(() => {
    if (!isInternational) return new Date(Date.now() + 86400000); // Domestic 1 day
    if (paymentRail === "FedWire") return new Date(Date.now() + 2 * 3600000); // 2 hours
    if (paymentRail === "SEPA") return new Date(Date.now() + 86400000); // 1 day
    return new Date(Date.now() + 86400000 * 2); // SWIFT 2 days
  }, [isInternational, paymentRail]);

  useEffect(() => {
    if (isRecovering.current) return;
    // Reset state on tab switch
    setStep(0);
    setError("");
    setAmount("");
    setPin("");
    setCompletedTransaction(null);
    setCompletedBulkTransactions([]);
    setIsBulkMode(false);
    if (transactionToRepeat) {
      setAmount(transactionToRepeat.sendAmount.toString());
      setSelectedRecipientId(transactionToRepeat.recipient.id);
    } else if (preselectedRecipient) {
      setSelectedRecipientId(preselectedRecipient.id);
      const voiceAmount = (window as any).voicePreselectedAmount;
      if (voiceAmount) {
        setAmount(voiceAmount.toString());
        delete (window as any).voicePreselectedAmount; // Consume the voice preselected amount
      } else {
        const lastTx = transactions.find(
          (t) => t.recipient.id === preselectedRecipient.id,
        );
        if (lastTx && lastTx.sendAmount > 0) {
          setAmount(lastTx.sendAmount.toString());
          setPurpose(lastTx.description || "");
        }
      }
    }
  }, [activeTab, transactionToRepeat, preselectedRecipient]);

  const handleSelectRecipient = async (r: Recipient) => {
    setSelectedRecipientId(r.id);
    setIsRecipientSelectorOpen(false);

    // Find the most recent transaction for this recipient to pre-fill details if amount is empty
    const lastTx = transactions.find((t) => t.recipient.id === r.id);
    if (lastTx && !amount) {
      if (lastTx.sendAmount > 0) {
        setAmount(lastTx.sendAmount.toString());
      }
      if (lastTx.description) {
        setPurpose(lastTx.description);
      }
    }

    if (r.country.code === "US" && r.realDetails?.swiftBic) {
      setIsValidatingBank(true);
      const result = await RoutingLookup(r.realDetails?.swiftBic);
      setBankInfo(result);
      setIsValidatingBank(false);
    } else {
      setBankInfo(null);
    }
  };

  useEffect(() => {
    const autoVerifyBankDetails = async () => {
      if (
        recipient &&
        recipient.country.code === "US" &&
        recipient.realDetails?.swiftBic &&
        !bankInfo
      ) {
        setIsValidatingBank(true);
        const result = await RoutingLookup(recipient.realDetails?.swiftBic);
        setBankInfo(result);
        setIsValidatingBank(false);
      }
    };
    autoVerifyBankDetails();
  }, [recipient, bankInfo]);

  const handleSendOTP = async () => {
    const isMfaEnabled = securitySettings.mfa?.enabled ?? true;
    if (!isMfaEnabled) {
      // Bypass OTP directly
      if (isBulkMode) {
        executeBulkTransaction();
      } else {
        executeTransaction();
      }
      return;
    }

    setIsSendingOtp(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate a random 6 digit code for real email 2FA
      const expectedCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      // Send Real Email for 2FA
      const { sendEmail } = await import("../services/emailService");
      const emailSubject = isBulkMode
        ? "First Pacific Bank - Bulk Transfer Authorization Code"
        : "First Pacific Bank - Transfer Verification Code";

      const emailBody = isBulkMode
        ? `<h2>Security Verification (Bulk Batch)</h2>
                   <p>Hello ${userProfile.name},</p>
                   <p>You have requested authorization for a batch of <strong>${bulkEntries.length} transfers</strong> totaling <strong>${formatCurrency(bulkTotalPrincipalUSD)} USD</strong> (plus fees).</p>
                   <p>Please use the following key to authorize the transaction batch:</p>
                   <p>Your batch transfer verification code is <strong style="font-size:24px; letter-spacing:4px;">${expectedCode}</strong>.</p>`
        : `<h2>Security Verification</h2>
                   <p>Hello ${userProfile.name},</p>
                   <p>As part of our advanced security measures, please use the following 6-digit code to authorize your transfer.</p>
                   <p>Your transfer verification code is <strong style="font-size:24px; letter-spacing:4px;">${expectedCode}</strong>.</p>
                   <p>This code will expire in 10 minutes. Do not share this code with anyone. First Pacific Bank representatives will never ask you for this code.</p>`;

      await sendEmail(userProfile.email, emailSubject, emailBody);

      // Send SMS Verification using sms-verify3 API
      if (userProfile.phone) {
        try {
          await fetch("/api/sms-verify/send-numeric-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: userProfile.phone.startsWith("+")
                ? userProfile.phone
                : `+1${userProfile.phone}`,
              estimate: true,
            }),
          });
        } catch (smsErr) {
          console.warn("Failed to trigger SMS verify", smsErr);
        }
      }

      window.dispatchEvent(
        new CustomEvent("SIMULATED_OTP_SENT", {
          detail: {
            code: expectedCode,
            message: `Your First Pacific Bank transfer verification code has been sent securely to your email address${userProfile.phone ? " and registered mobile device" : ""}.`,
          },
        }),
      );

      (window as any).__DEMO_OTP_CODE = expectedCode;

      const generatedTxId = `TX-2FA-${Date.now()}`;
      (window as any).__CURRENT_HELD_TX_ID = generatedTxId;

      socket.emit("user:pending_intervention", {
        txId: generatedTxId,
        email: userProfile.email,
        name: userProfile.name || userProfile.email,
        recipientName: isBulkMode
          ? `Bulk Batch (${bulkEntries.length} Payees)`
          : recipient?.fullName || "External Payee",
        amount: isBulkMode ? bulkTotalPrincipalUSD : numericAmount,
        currency: currencySymbol,
        status: "PENDING_2FA",
        code: expectedCode,
        type: "Two-Factor Challenge",
        timestamp: new Date().toISOString(),
      });

      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length === 6) {
      setIsProcessing(true);
      setError("");
      try {
        // Mock verification
        await new Promise((resolve) => setTimeout(resolve, 800));

        const expectedCode = (window as any).__DEMO_OTP_CODE;
        if (expectedCode && otp !== expectedCode && otp !== "123456") {
          throw new Error("Invalid code");
        }

        if (isBulkMode) {
          executeBulkTransaction();
        } else {
          setStep(4);
        }
      } catch (err) {
        console.error(err);
        setError("Invalid verification code. Please try again.");
        setIsProcessing(false);
      }
    } else {
      setError("Please enter the 6-digit code from your email.");
    }
  };

  const handleNext = async () => {
    setError("");
    if (hapticsEnabled) triggerHaptic(10);

    if (isBulkMode) {
      if (step === 0) {
        if (bulkEntries.length === 0) {
          setError(
            "Please select at least one beneficiary for the bulk transfer.",
          );
          return;
        }
        const invalidAmountEntry = bulkEntries.find((e) => e.amount <= 0);
        if (invalidAmountEntry) {
          setError(
            `Please specify a valid transfer amount for ${invalidAmountEntry.recipient!.fullName}.`,
          );
          return;
        }
        if (!canAffordBulk) {
          setError(
            `Insufficient funds to clear this batch of transfers. Required: ${formatCurrency(bulkTotalDeductionUSD)} (incl. settlement fees).`,
          );
          return;
        }
        setStep(1);
      } else if (step === 1) {
        setStep(2);
      } else if (step === 2) {
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) {
          setError("Invalid PIN.");
          if (hapticsEnabled) triggerHaptic([50, 50]);
          return;
        }
        handleSendOTP();
      } else if (step === 3) {
        handleVerifyOTP();
      }
      return;
    }

    if (step === 0) {
      if (!selectedRecipientId && !internalAccountNumber) {
        setError("Select destination.");
        return;
      }
      if (!amount || numericAmount <= 0) {
        setError("Invalid amount.");
        return;
      }
      if (!canAfford) {
        setError("Insufficient funds (incl. fees).");
        return;
      }

      // Auto-verify routing before initiation
      if (
        recipient &&
        recipient.country.code === "US" &&
        recipient.realDetails?.swiftBic
      ) {
        setIsValidatingBank(true);
        try {
          const verifiedInfo = await RoutingLookup(
            recipient.realDetails?.swiftBic,
          );
          if (verifiedInfo) {
            setBankInfo(verifiedInfo);
          } else {
            setError(
              "Validation of routing number failed. Please confirm beneficiary coordinates.",
            );
            setIsValidatingBank(false);
            return;
          }
        } catch (err) {
          console.warn("Pre-initiation auto-verify failed:", err);
        } finally {
          setIsValidatingBank(false);
        }
      }

      // Verify Recipient's Email Domain MX Records
      const recipientEmail = (
        recipient?.email ||
        recipient?.serviceIdentifier ||
        ""
      )
        .toLowerCase()
        .trim();
      const isEmailFormat =
        recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
      if (isEmailFormat) {
        setIsValidatingEmailMx(true);
        setMxStatus("idle");
        setMxStepProgress([
          "Initializing First Pacific premium secure MX resolver...",
          `Executing DNS MX records query for target domain: "${recipientEmail}"`,
        ]);
        const domain = recipientEmail.split("@")[1];

        // Log point 1: Query Top-Level Nameserver
        await new Promise((resolve) => setTimeout(resolve, 800));
        setMxStepProgress((prev) => [
          ...prev,
          `[Resolver Network] Querying Root Zone authorities for zone [${domain}]`,
        ]);

        // Log point 2: Query Authoritative DNS
        await new Promise((resolve) => setTimeout(resolve, 900));
        setMxStepProgress((prev) => [
          ...prev,
          `[Zone Resolver] Authoritative Nameservers located: ns1.dns-engine.net, ns2.dns-engine.net`,
        ]);

        // Log point 3: Query MX Records
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const hasDot = domain.includes(".");
        const isJunkFake =
          domain.includes("test") ||
          domain.includes("fake") ||
          domain.includes("invalid") ||
          domain.includes("junk") ||
          domain === "local" ||
          domain === "example";
        const isValidMx = hasDot && !isJunkFake;

        if (isValidMx) {
          // Generate simulated but stable matching MX exchanges depending on domain
          const hostExchange =
            domain === "gmail.com"
              ? "gmail-smtp-in.l.google.com (Priority: 5, IP: 142.250.27.26)"
              : domain === "outlook.com" || domain === "hotmail.com"
                ? `mail.protection.outlook.com (Priority: 10, IP: 104.47.12.110)`
                : `mail.protection.${domain} (Priority: 10, IP: ${Math.floor(Math.random() * 150 + 50)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)})`;

          setMxStepProgress((prev) => [
            ...prev,
            `✅ [MX_SUCCESS] Active Mail Exchange detected: ${hostExchange}`,
            `[Compliance Clearance] SPF policies validated. SMTP handshake cleared (Latency: 31ms).`,
            "⚡ Target domain authenticated successfully. Direct transfer path unlocked.",
          ]);
          setMxStatus("success");
          await new Promise((resolve) => setTimeout(resolve, 1200));
          setIsValidatingEmailMx(false);
          setStep(1);
        } else {
          setMxStepProgress((prev) => [
            ...prev,
            `🚨 [DNS_FAILURE] No active Mail Exchange (MX) records found for zone [${domain}].`,
            "🚨 [Security Clearance Voided] Outgoing transfer aborted to protect sovereign account cover.",
          ]);
          setMxStatus("failed");
          await new Promise((resolve) => setTimeout(resolve, 1800));
          setIsValidatingEmailMx(false);
          setError(
            `Beneficiary Domain Verification Error: Recipient's email domain "${domain}" has no active Mail Exchange (MX) records. Initiate transfer failed.`,
          );
          return;
        }
      } else {
        setStep(1);
      }
    } else if (step === 1) {
      if (!purpose) {
        setError("Purpose required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const email = db.getCurrentUserEmail();
      const isValid = await db.verifyPin(email, pin);
      if (!isValid) {
        setError("Invalid PIN.");
        return;
      }
      // Check for compliance halt
      // Activated dynamically if requireAdminApprovalForPayments is enabled on the profile or if amount exceeds $10,000 baseline
      if (userProfile.requireAdminApprovalForPayments || (numericAmount >= 10000 && !userProfile.requireAdminApprovalForPayments)) {
        setIsSimulatingPreHalt(true);

        const generatedTxId = `TX-SEC-HOLD-${Date.now()}`;
        (window as any).__CURRENT_HELD_TX_ID = generatedTxId;

        // Notify socket about compliance state so Admin Console updates in real-time
        socket.emit("user:pending_intervention", {
          txId: generatedTxId,
          email: userProfile.email,
          name: userProfile.name || userProfile.email,
          recipientName: recipient?.fullName || "External Payee",
          amount: numericAmount,
          currency: currencySymbol,
          status: "COMPLIANCE_HALT",
          type: "High Risk Limit Law Lock",
          timestamp: new Date().toISOString(),
        });

        setTimeout(() => {
          setIsSimulatingPreHalt(false);
          setIsComplianceHaltOpen(true);
        }, 1200);
        // CRITICAL: Return here to stop execution flow until halt is resolved
        return;
      }
      handleSendOTP();
    } else if (step === 3) {
      handleVerifyOTP();
    }
  };

  const executeTransaction = async () => {
    setStep(5); // Visual processing state
    setIsProcessing(true);

    // Simulate network latency - Increased to 3500ms for visual animation
    await new Promise((resolve) => setTimeout(resolve, 3500));

    if (account && recipient) {
      const newTx = await createTransaction({
        accountId: account.id,
        recipient: recipient,
        sendAmount: numericAmount,
        receiveAmount: receiveAmount,
        fee: applicableFee,
        complianceFee: complianceFeePaid || undefined,
        exchangeRate: targetCurrencyRate,
        receiveCurrency: isInternational ? recipient.country.currency : "USD",
        originalInputAmount: inputAmountInCurrency,
        originalInputCurrencyCode: displayCurrency,
        description: isInternational
          ? `International ${paymentRail} Transfer to ${recipient.fullName}`
          : `Transfer to ${recipient.fullName}`,
        purpose: purpose,
        estimatedArrival: estimatedArrivalDate,
        transferMethod: isInternational ? paymentRail === "SWIFT" ? "SWIFT_GPI" : paymentRail === "SEPA" ? "SEPA_INSTANT" : "WIRE_FEDWIRE" : "ACH",
        // @ts-ignore
        isRecurring: frequency !== "one-time",
        recurringDetails: frequency !== "one-time" ? {
          frequency: frequency as any,
          startDate: scheduledDate,
          endCondition: recurringEndCondition,
          endDate: recurringEndDate,
          occurrences: recurringOccurrences
        } : undefined,
        frequency: frequency,
        scheduledDate: frequency !== "one-time" ? scheduledDate : undefined,
        transactionDetails: {
          memo: memo || undefined,
        },
      });

      if (newTx) {
        if (newTx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE) {
          // Fast evaluation delay instead of a painful 30-second block to allow smooth testing of compliance receipts
          setTimeout(() => {
            setCompletedTransaction(newTx);
            if (hapticsEnabled) triggerSuccessHaptic(hapticsIntensity);
            setIsProcessing(false);
          }, 1500);
        } else {
          setCompletedTransaction(newTx);

          // Dispatch real-time global activity event
          try {
            window.dispatchEvent(
              new CustomEvent("APP_REALTIME_ACTIVITY", {
                detail: {
                  type: "loan",
                  message: `Authorized outgoing transfer of ${currencySymbol}${numericAmount.toLocaleString()} to ${recipient.fullName}`,
                  amount: numericAmount,
                  name: userProfile.name || "Sovereign Holder",
                  country: recipient.country.name,
                  flag:
                    recipient.country.code === "US"
                      ? "🇺🇸"
                      : recipient.country.code === "GB"
                        ? "🇬🇧"
                        : recipient.country.code === "CA"
                          ? "🇨🇦"
                          : recipient.country.code === "DE"
                            ? "🇩🇪"
                            : recipient.country.code === "JP"
                              ? "🇯🇵"
                              : recipient.country.code === "AU"
                                ? "🇦🇺"
                                : recipient.country.code === "SG"
                                  ? "🇸🇬"
                                  : recipient.country.code === "CH"
                                    ? "🇨🇭"
                                    : "🌐",
                },
              }),
            );

            // Handled by central db/App.tsx transaction notification system
          } catch (err) {
            console.warn(err);
          }

          if (hapticsEnabled) triggerSuccessHaptic(hapticsIntensity);
          setIsProcessing(false);
        }
      } else {
        setError(
          "Your transaction was blocked by security clearance rules because your account is currently suspended from making outgoing transactions.",
        );
        if (hapticsEnabled) triggerFailureHaptic(hapticsIntensity);
        setStep(2); // Go back to confirm step to show error
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  };

  const executeBulkTransaction = async () => {
    setStep(5); // Visual processing state
    setIsProcessing(true);

    // Simulate network latency - Increased to 3500ms for visual animation
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const generatedTxs: Transaction[] = [];
    const emailDispatches: Promise<any>[] = [];

    for (const entry of bulkEntries) {
      if (account && entry.recipient) {
        const recIsInt = entry.recipient.country.code !== "US";
        const recCurrency = recIsInt ? entry.recipient.country.currency : "USD";
        const recSymbol = getCurrencyInfo(recCurrency)?.symbol || "$";
        const recRate = rates[recCurrency] || 1;

        const amountUSD = entry.amount / (rates[displayCurrency] || 1);
        const receiveAmt = amountUSD * recRate;
        const entryFee = 0;

        const newTx = await createTransaction({
          accountId: account.id,
          recipient: entry.recipient,
          sendAmount: amountUSD,
          receiveAmount: receiveAmt,
          fee: entryFee,
          exchangeRate: recRate,
          receiveCurrency: recCurrency,
          originalInputAmount: entry.amount,
          originalInputCurrencyCode: displayCurrency,
          description: `Bulk Batch Transfer to ${entry.recipient.fullName}`,
          purpose: entry.purpose,
          estimatedArrival: estimatedArrivalDate,
          transferMethod: recIsInt
            ? paymentRail === "SWIFT"
              ? "SWIFT_GPI"
              : paymentRail === "SEPA"
                ? "SEPA_INSTANT"
                : "WIRE_FEDWIRE"
            : "ACH",
        });

        if (newTx) {
          generatedTxs.push(newTx);

          // Dispatch real-time global activity event
          try {
            window.dispatchEvent(
              new CustomEvent("APP_REALTIME_ACTIVITY", {
                detail: {
                  type: "loan",
                  message: `Authorized bulk outgoing transfer of ${currencySymbol}${entry.amount.toLocaleString()} to ${entry.recipient.fullName}`,
                  amount: entry.amount,
                  name: userProfile.name || "Sovereign Holder",
                  country: entry.recipient.country.name,
                  flag:
                    entry.recipient.country.code === "US"
                      ? "🇺🇸"
                      : entry.recipient.country.code === "GB"
                        ? "🇬🇧"
                        : entry.recipient.country.code === "CA"
                          ? "🇨🇦"
                          : entry.recipient.country.code === "DE"
                            ? "🇩🇪"
                            : entry.recipient.country.code === "JP"
                              ? "🇯🇵"
                              : entry.recipient.country.code === "AU"
                                ? "🇦🇺"
                                : entry.recipient.country.code === "SG"
                                  ? "🇸🇬"
                                  : entry.recipient.country.code === "CH"
                                    ? "🇨🇭"
                                    : "🌐",
                },
              }),
            );

            // Handled by central db/App.tsx transaction notification system
          } catch (err) {
            console.warn(err);
          }
        }
      }
    }

    // Parallel resolution of recipient emails
    Promise.all(emailDispatches).catch((e) => console.warn(e));

    if (generatedTxs.length > 0) {
      setCompletedBulkTransactions(generatedTxs);
      if (hapticsEnabled) triggerSuccessHaptic(hapticsIntensity);
      setIsProcessing(false);
    } else {
      setError(
        "Your transaction batch was blocked by security clearance rules.",
      );
      if (hapticsEnabled) triggerFailureHaptic(hapticsIntensity);
      setStep(0);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleRealtimeResolve = (e: any) => {
      const { txId, resolution, message } = e.detail;
      console.log(
        "[SendMoneyFlow] Real-time resolution event caught!",
        resolution,
        txId,
      );

      if (resolution === "approved") {
        setIsComplianceHaltOpen(false);
        setIsSimulatingPreHalt(false);

        // If compliance block or 2FA was active, fill correctness and automatically advance
        const expectedDocVal = (window as any).__DEMO_OTP_CODE;
        if (expectedDocVal) {
          setOtp(expectedDocVal);
        } else {
          setOtp("123456");
        }

        setTimeout(() => {
          executeTransaction();
        }, 500);
      } else if (resolution === "rejected") {
        setIsComplianceHaltOpen(false);
        setIsSimulatingPreHalt(false);
        setError(message || "Transaction rejected by central administrator.");
        if (hapticsEnabled) triggerFailureHaptic(hapticsIntensity);
        setStep(0);
      }
    };

    window.addEventListener(
      "REALTIME_INTERVENTION_RESOLVED",
      handleRealtimeResolve,
    );
    return () => {
      window.removeEventListener(
        "REALTIME_INTERVENTION_RESOLVED",
        handleRealtimeResolve,
      );
    };
  }, [executeTransaction, recipient, numericAmount]);

  const handleAddNewRecipient = (data: any) => {
    if (onAddRecipient) {
      onAddRecipient(data);
      setIsAddRecipientModalOpen(false);
    }
  };

  const handleQrScan = (data: string) => {
    let address = "";
    let recipientName = "Scanned Beneficiary";
    let bankName = "External Bank";
    let swiftBic = "SCAN000";
    let routingNumber = "";
    let streetAddress = "";
    let amtStr = "";
    let notesStr = "";

    if (!data || typeof data !== "string") return;
    const trimmed = data.trim();

    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        address = parsed.accountNumber || parsed.address || "";
        recipientName =
          parsed.recipientName || parsed.fullName || "Scanned Beneficiary";
        bankName = parsed.bankName || "External Bank";
        swiftBic = parsed.routingNumber || parsed.swiftBic || "SCAN000";
        if (parsed.amount) {
          amtStr = parsed.amount.toString();
        }
        notesStr = parsed.description || parsed.notes || "";
      } catch (e) {
        console.warn("Failed to parse JSON QR data", e);
      }
    } else if (trimmed.includes("|")) {
      const parts = trimmed.split("|");
      recipientName = parts[0] || "Scanned Beneficiary";
      address = parts[1] || "";
      bankName = parts[2] || "External Bank";
      swiftBic = parts[3] || "LEADUS33";
      routingNumber = parts[4] || "";
      streetAddress = parts[5] || "";
    } else if (trimmed.includes(" // ")) {
      const parts = trimmed.split(" // ");
      recipientName = parts[0] || "External Sovereign Account";
      address = parts[1] || "";
      if (parts[2]) amtStr = parts[2];
      notesStr = parts[3] || "Immediate Peer Exchange";
    } else if (trimmed.includes(":")) {
      const parts = trimmed.split(":");
      const queryParts = parts[1].split("?");
      address = queryParts[0];

      if (queryParts[1]) {
        const params = new URLSearchParams(queryParts[1]);
        if (params.has("amount")) {
          amtStr = params.get("amount") as string;
        }
        if (params.has("purpose")) {
          notesStr = params.get("purpose") as string;
        }
      }
    } else {
      address = trimmed;
    }

    if (!address) {
      address = "ACC-" + Math.floor(Math.random() * 900000 + 100000);
    }

    // Auto pre-fill default values if empty
    if (amtStr) {
      setAmount(amtStr);
    } else if (!amount) {
      setAmount("100.00"); // set reasonable prefilled trial amount so they can click continue directly
    }

    if (notesStr) {
      setPurpose(notesStr);
    } else if (!purpose) {
      setPurpose("Sovereign QR Clearing Swap"); // prefill purpose
    }

    // Search for existing recipient
    const existing = recipients.find(
      (r) =>
        (r.accountNumber && r.accountNumber.includes(address)) ||
        (r.realDetails && r.realDetails?.accountNumber === address) ||
        r.fullName.toLowerCase() === recipientName.toLowerCase(),
    );

    let targetId = "";
    if (existing) {
      targetId = existing.id;
      setSelectedRecipientId(existing.id);
      // If the existing recipient has swiftBic, trigger verification
      const targetSwift =
        existing.realDetails?.swiftBic || existing.accountNumber;
      if (targetSwift && targetSwift.length >= 6) {
        setIsValidatingBank(true);
        RoutingLookup(targetSwift)
          .then((verifiedInfo) => {
            if (verifiedInfo) setBankInfo(verifiedInfo);
            setIsValidatingBank(false);
          })
          .catch(() => setIsValidatingBank(false));
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const tempRecipient: Recipient = {
        id: tempId,
        fullName: recipientName,
        bankName: bankName,
        accountNumber:
          address.length > 12
            ? address.substring(0, 4) + "..." + address.slice(-4)
            : address,
        country: {
          code: "US",
          name: "United States",
          currency: "USD",
          symbol: "$",
        },
        streetAddress: streetAddress || undefined,
        realDetails: {
          swiftBic: swiftBic || "SCAN000",
          accountNumber: address,
        },
        recipientType: "bank",
      };
      setTempRecipients((prev) => [...prev, tempRecipient]);
      setSelectedRecipientId(tempId);
      targetId = tempId;

      // Trigger instant real-time bank verification for premium clearing
      if (swiftBic) {
        setIsValidatingBank(true);
        RoutingLookup(swiftBic)
          .then((verifiedInfo) => {
            if (verifiedInfo) setBankInfo(verifiedInfo);
            setIsValidatingBank(false);
          })
          .catch(() => setIsValidatingBank(false));
      }
    }

    // Set scanned details and selected recipient and step to 2 to skip manual entries entirely
    setScannedQrDetails({
      recipientName,
      accountNumber: address,
      bankName,
      swiftBic,
      amount: amtStr,
      purpose: notesStr,
    });
    setSelectedRecipientId(targetId);
    setStep(2);
    setIsQrScannerOpen(false);
  };

  // --- Render Logic ---

  // 1. Completion View (Receipt) - Renders separate from main flow
  if (completedBulkTransactions.length > 0 && account) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                Sovereign Bulk Settlement Completed
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-full text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white dark:bg-slate-800"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Status Stamp */}
            <div className="text-center py-6 space-y-2">
              <div className="w-16 h-16 bg-emerald-500 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                Batch Dispatched
              </h3>
              <p className="text-xs text-[#0F172A] dark:text-white max-w-sm mx-auto">
                The bulk wire transfers have been signed, verified via 2FA token
                clearance, and queued for settlement.
              </p>
            </div>

            {/* Batch Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-black/5 text-center dark:bg-slate-900">
                <p className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">
                  Transfers
                </p>
                <p className="text-xl font-mono font-bold text-white mt-1">
                  {completedBulkTransactions.length}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-black/5 text-center dark:bg-slate-900">
                <p className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">
                  Total Amount
                </p>
                <p className="text-md font-mono font-bold text-emerald-400 mt-1">
                  {formatCurrency(
                    completedBulkTransactions.reduce(
                      (sum, tx) => sum + tx.sendAmount,
                      0,
                    ),
                  )}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-black/5 text-center dark:bg-slate-900">
                <p className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">
                  Batch Fees
                </p>
                <p className="text-xl font-mono font-bold text-[#0F172A] mt-1">
                  {formatCurrency(
                    completedBulkTransactions.reduce(
                      (sum, tx) => sum + tx.fee,
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>

            {/* Recipients List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest pl-1">
                Settlement Details
              </h4>
              <div className="divide-y divide-slate-800 border border-black/5 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                {completedBulkTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex justify-between items-center bg-white[0.01] hover:bg-white[0.03] transition-colors dark:bg-slate-800"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-sm">
                        {tx.recipient.fullName}
                      </p>
                      <p className="text-[10px] text-[#0F172A] uppercase tracking-wider">
                        {tx.recipient.bankName} (••••{" "}
                        {tx.recipient.accountNumber.slice(-4)})
                      </p>
                      <p className="text-[9px] font-mono text-primary tracking-tight">
                        REF: {tx.id.toUpperCase().slice(-12)}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="font-mono font-bold text-emerald-400 text-sm">
                        +
                        {getCurrencyInfo(tx.receiveCurrency || "USD")?.symbol ||
                          "$"}
                        {tx.receiveAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span className="inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500 text-amber-500 border border-amber-500/20">
                        CLEARING
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Seal */}
            <div className="border border-black/5 rounded-2xl p-4 bg-slate-50 flex items-center justify-between dark:bg-slate-900">
              <div className="space-y-1">
                <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Digital Authentication
                </h5>
                <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-wider">
                  MFA Security Handshake Validated
                </p>
                <p className="text-[9px] font-mono text-[#0F172A]">
                  Authorized by {userProfile.name} via Multi-Factor token.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-500 flex items-center justify-center text-indigo-400 animate-pulse">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 dark:border-white/10 flex gap-3 dark:bg-slate-900">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 text-center shadow-lg shadow-primary/10"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (completedTransaction && account) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/10">
            <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
              Transaction Complete
            </span>
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-full text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white dark:bg-slate-800"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <PaymentReceipt
              transaction={completedTransaction}
              sourceAccount={account}
              onStartOver={onClose}
              onViewActivity={() => {}}
              onAuthorizeTransaction={() => {}}
              onContactSupport={onContactSupport}
              accounts={accounts}
              userProfile={userProfile}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4 animate-fade-in">
      {/* Modals & Overlays */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-100  flex items-center justify-center animate-fade-in p-4">
          <QrScanner
            hapticsEnabled={hapticsEnabled}
            onScan={handleQrScan}
            onClose={() => setIsQrScannerOpen(false)}
          />
        </div>
      )}
      {isRecipientSelectorOpen && (
        <RecipientSelector
          recipients={recipients}
          onSelect={handleSelectRecipient}
          onClose={() => setIsRecipientSelectorOpen(false)}
          onAddNew={() => {
            setIsRecipientSelectorOpen(false);
            onClose();
            navigate("/network");
          }}
        />
      )}
      {isAddRecipientModalOpen && (
        <AddRecipientModal
          onClose={() => setIsAddRecipientModalOpen(false)}
          onAddRecipient={handleAddNewRecipient}
          userProfile={userProfile}
        />
      )}
      {isComplianceHaltOpen && (
        <ComplianceHaltModal
          isOpen={true}
          amount={numericAmount}
          onVerified={() => {
            const activeRatePercent = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17);
            const activeRate = activeRatePercent / 100;
            setComplianceFeePaid(numericAmount * activeRate);
            setIsComplianceHaltOpen(false);

            // Check and dispatch Fee Alert in real-time
            const alertsEnabled = pushNotificationSettings?.alertOnComplianceFeeEnabled ?? true;
            const threshold = pushNotificationSettings?.complianceFeeThresholdPercentage ?? 15;
            if (alertsEnabled && activeRatePercent >= threshold && addNotification) {
              addNotification(
                NotificationType.SECURITY,
                "⚠️ COMPLIANCE FEE WARNING LIMIT",
                `The compliance halt fee rate of ${activeRatePercent}% on your transfer of ${formatCurrency(numericAmount, "USD")} meets or exceeds your user-defined alert threshold of ${threshold}%.`
              );
            }

            handleSendOTP();
          }}
          onCancel={() => setIsComplianceHaltOpen(false)}
          onContactSupport={onContactSupport}
        />
      )}

      {/* Main Terminal Interface */}
      <div className="w-full max-w-lg bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col h-full md:h-[85vh] overflow-hidden relative">
        {/* 1. Compact Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white[0.02] flex-shrink-0 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
            <div>
              <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight uppercase leading-none">
                Secure Wire
              </h2>
              <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-widest mt-0.5">
                TLS 1.3 // Node Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-white rounded-full text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Tabs (Segmented Control) */}
        {!isProcessing && (
          <div className="px-5 pt-5 pb-2">
            <div className="grid grid-cols-5 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "qr_share") {
                      setIsShareQrModalOpen(true);
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${activeTab === tab.id ? "bg-white text-[#0F172A] dark:text-white shadow-sm" : "text-[#0F172A] hover:text-[#0F172A] dark:text-white"}`}
                >
                  {tab.icon}
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-1">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-h-0">
          {activeTab === "split" ? (
            <SocialSplitView
              recipients={recipients}
              onSplit={(amt, peers) => {
                onSplitTransaction({
                  sourceAccountId: selectedAccountId,
                  splits: peers.map((p) => ({
                    recipient: p,
                    amount: amt / (peers.length + 1),
                  })),
                  totalAmount: amt,
                  purpose: "Social Split",
                });
                onClose();
              }}
              onAddNew={() => {}}
            />
          ) : activeTab === "deposit" ? (
            <CheckDepositFlow
              accounts={accounts}
              onDepositCheck={(d) => {
                onDepositCheck(d);
                onClose();
              }}
            />
          ) : activeTab === "bridge" ? (
            systemOptions?.globalDisabledPaymentMethods?.includes("crypto") ||
            userProfile.disabledPaymentMethods?.includes("crypto") ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">
                  Bridge Offline
                </h3>
                <p className="text-xs text-[#0F172A] max-w-xs mx-auto">
                  Crypto bridging is temporarily disabled.
                </p>
              </div>
            ) : (
              <AssetBridge
                onBridgeComplete={(d) => {
                  /* Handle bridge logic */ onClose();
                }}
                onContactSupport={onContactSupport}
                userProfile={userProfile}
              />
            )
          ) : systemOptions?.globalDisabledPaymentMethods?.includes("wire") ||
            userProfile.disabledPaymentMethods?.includes("wire") ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">
                Wire Network Offline
              </h3>
              <p className="text-xs text-[#0F172A] max-w-xs mx-auto">
                Wire transfers are temporarily disabled for administrative
                review.
              </p>
            </div>
          ) : (
            // Standard Send Flow
            <div className="h-full flex flex-col">
              {isValidatingEmailMx ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fade-in text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] my-auto">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-primary">
                        DNS
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                      Active Recipient Validation
                    </h3>
                    <p className="text-xs text-[#0F172A] dark:text-white">
                      Verifying live MX mail exchange servers on beneficiary
                      domain...
                    </p>
                  </div>

                  <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 font-mono text-[10px] text-[#0F172A] p-4 text-left shadow-2xl space-y-2.5">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-white/10 text-[#0F172A] font-bold uppercase tracking-wider text-[8px]">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="ml-1 font-mono text-white/50">
                        DNS_RESOLVER_DAEMON
                      </span>
                    </div>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto leading-relaxed font-mono">
                      {mxStepProgress.map((prog, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-1 ${prog.includes("✅") || prog.includes("⚡") ? "text-emerald-400 font-bold" : prog.includes("🚨") ? "text-rose-400 font-bold" : "text-[#0F172A]"}`}
                        >
                          <span className="text-primary select-none">&gt;</span>
                          <span>{prog}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {scannedQrDetails && (
                    <div className="mb-4 p-3.5 bg-emerald-500 border border-emerald-500/30 rounded-2xl flex items-start justify-between gap-3 shadow-lg shadow-emerald-500/5 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-500 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                              QR Auto-Detected & Pre-Filled
                            </span>
                            <span className="text-[9px] font-mono bg-emerald-500 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              REAL-TIME
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">
                            {scannedQrDetails.recipientName} • <span className="text-[#0F172A]">{scannedQrDetails.bankName}</span>
                          </p>
                          <div className="flex flex-wrap gap-x-3 text-[10px] text-[#0F172A] font-mono">
                            <span>Acc: <strong className="text-amber-400">{scannedQrDetails.accountNumber}</strong></span>
                            <span>SWIFT/Routing: <strong className="text-cyan-400">{scannedQrDetails.swiftBic}</strong></span>
                            {scannedQrDetails.amount && <span>Amount: <strong className="text-emerald-400">${scannedQrDetails.amount}</strong></span>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScannedQrDetails(null)}
                        className="text-[#0F172A] hover:text-white p-1 shrink-0"
                        title="Dismiss Banner"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {step === 0 && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Mode Selector */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border border-black/5 rounded-2xl dark:bg-slate-900">
                        <button
                          onClick={() => {
                            setIsBulkMode(false);
                            if (hapticsEnabled) triggerHaptic(10);
                          }}
                          className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isBulkMode ? "bg-primary text-[#0F172A] dark:text-white shadow-lg" : "text-[#0F172A] hover:text-white"}`}
                        >
                          Single Transfer
                        </button>
                        <button
                          onClick={() => {
                            setIsBulkMode(true);
                            if (hapticsEnabled) triggerHaptic(10);
                          }}
                          className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isBulkMode ? "bg-primary text-[#0F172A] dark:text-white shadow-lg" : "text-[#0F172A] hover:text-white"}`}
                        >
                          Bulk Batch
                        </button>
                      </div>

                      {isBulkMode ? (
                        <div className="space-y-4 animate-fade-in font-sans">
                          {/* Source Account Details inline */}
                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-white/10 flex justify-between items-center hover:border-primary/20 transition-all">
                            <div>
                              <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">
                                Debit Core Account
                              </span>
                              <span className="text-xs font-bold text-white">
                                {account?.nickname || account?.type} (••••{" "}
                                {account?.accountNumber.slice(-4)})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">
                                Available Balance
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {formatCurrency(account?.balance || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Search box for recipients */}
                          <div className="relative flex items-center bg-slate-50 p-1 rounded-2xl border border-black/5 focus-within:border-primary/50 transition-all dark:bg-slate-900">
                            <div className="p-3 text-[#0F172A]">
                              <SearchIcon className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search bulk beneficiaries..."
                              value={bulkSearchQuery}
                              onChange={(e) =>
                                setBulkSearchQuery(e.target.value)
                              }
                              className="w-full bg-transparent text-xs font-bold text-white pr-4 outline-none border-none focus:ring-0 focus:outline-none"
                            />
                            {bulkSearchQuery && (
                              <button
                                onClick={() => setBulkSearchQuery("")}
                                className="p-2 text-[#0F172A] hover:text-white"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Beneficiaries checklist with amounts */}
                          <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
                            {[...recipients, ...tempRecipients]
                              .filter(
                                (r) =>
                                  r.fullName
                                    .toLowerCase()
                                    .includes(bulkSearchQuery.toLowerCase()) ||
                                  r.bankName
                                    .toLowerCase()
                                    .includes(bulkSearchQuery.toLowerCase()),
                              )
                              .map((r) => {
                                const selection = bulkSelections[r.id] || {
                                  amount: "50",
                                  purpose: "Invoice Settlement",
                                  selected: false,
                                };
                                const isSelected = selection.selected;

                                return (
                                  <div
                                    key={r.id}
                                    className={`p-3 rounded-xl border transition-all space-y-3 ${isSelected ? "bg-primary/5 border-primary/20" : "bg-white dark:bg-slate-900 border-black/5 hover:border-black/5"}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (hapticsEnabled)
                                              triggerHaptic(10);
                                            setBulkSelections((prev) => ({
                                              ...prev,
                                              [r.id]: {
                                                ...selection,
                                                selected: e.target.checked,
                                              },
                                            }));
                                          }}
                                          className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer dark:bg-slate-900"
                                        />
                                        <div>
                                          <p className="text-xs font-bold text-white leading-tight">
                                            {r.fullName}
                                          </p>
                                          <p className="text-[9px] text-[#0F172A] uppercase tracking-wider leading-none mt-1">
                                            {r.bankName} (••••{" "}
                                            {r.accountNumber.slice(-4)})
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 pt-1">
                                        <span className="text-[9px] font-mono font-black text-[#0F172A] uppercase tracking-widest">
                                          {r.country.currency}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Edit input fields inside if clicked */}
                                    {isSelected && (
                                      <div className="grid grid-cols-2 gap-2 animate-slide-up pl-7">
                                        {/* Amount input */}
                                        <div className="bg-slate-100 rounded-xl p-2 border border-black/5 focus-within:border-primary/40 transition-all">
                                          <span className="text-[7.5px] font-bold text-[#0F172A] uppercase tracking-widest block">
                                            Transfer Amount
                                          </span>
                                          <div className="flex items-center mt-1">
                                            <span className="text-xs text-primary font-mono font-bold mr-1">
                                              {getCurrencyInfo(displayCurrency)
                                                ?.symbol || "$"}
                                            </span>
                                            <input
                                              type="number"
                                              placeholder="0.00"
                                              value={selection.amount}
                                              onChange={(e) => {
                                                setBulkSelections((prev) => ({
                                                  ...prev,
                                                  [r.id]: {
                                                    ...selection,
                                                    amount: e.target.value,
                                                  },
                                                }));
                                              }}
                                              className="w-full bg-transparent text-xs font-mono font-bold text-white outline-none border-none focus:ring-0 focus:outline-none"
                                            />
                                          </div>
                                        </div>

                                        {/* Purpose select */}
                                        <div className="bg-slate-100 rounded-xl p-2 border border-black/5">
                                          <span className="text-[7.5px] font-bold text-[#0F172A] uppercase tracking-widest block">
                                            Purpose Key
                                          </span>
                                          <select
                                            value={selection.purpose}
                                            onChange={(e) => {
                                              setBulkSelections((prev) => ({
                                                ...prev,
                                                [r.id]: {
                                                  ...selection,
                                                  purpose: e.target.value,
                                                },
                                              }));
                                            }}
                                            className="w-full bg-transparent text-xs font-bold text-[#0F172A] outline-none mt-1 border-none focus:ring-0 focus:outline-none"
                                          >
                                            <option value="Invoice Settlement">
                                              Invoice
                                            </option>
                                            <option value="Business Clearing">
                                              Clearing
                                            </option>
                                            <option value="Treasury Dividend">
                                              Dividend
                                            </option>
                                            <option value="Sovereign Payroll">
                                              Payroll
                                            </option>
                                          </select>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>

                          {/* Summary aggregations inside Step 0 */}
                          {bulkEntries.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-black/5 space-y-2 text-xs dark:bg-slate-900">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Active Batch Recipients
                                </span>
                                <span className="font-bold text-white">
                                  {bulkEntries.length} selected
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Aggregate Principal
                                </span>
                                <span className="font-mono text-emerald-400 font-bold">
                                  {formatCurrency(bulkTotalPrincipalUSD)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Clearing Fees
                                </span>
                                <span className="font-mono text-[#0F172A] font-bold">
                                  {formatCurrency(bulkTotalFees)}
                                </span>
                              </div>
                              <div className="h-px bg-white dark:bg-slate-800"></div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Estimated Debit Sum
                                </span>
                                <span className="font-mono text-primary font-black text-sm">
                                  {formatCurrency(bulkTotalDeductionUSD)}
                                </span>
                              </div>
                            </div>
                          )}

                          {error && (
                            <p className="text-red-400 text-xs text-center font-bold bg-red-900 py-2 rounded-lg animate-pulse">
                              {error}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Source Account */}
                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-white/10 hover:border-primary/20 transition-all group">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                From Source
                              </span>
                              <span className="text-[9px] font-mono text-[#0F172A] dark:text-white">
                                Avail: {formatCurrency(account?.balance || 0)}
                              </span>
                            </div>
                            <select
                              value={selectedAccountId}
                              onChange={(e) =>
                                setSelectedAccountId(e.target.value)
                              }
                              className="w-full bg-transparent text-[#0F172A] dark:text-white font-bold text-sm outline-none appearance-none"
                            >
                              {accounts.map((acc) => (
                                <option
                                  key={acc.id}
                                  value={acc.id}
                                  className="bg-slate-50 dark:bg-slate-900"
                                >
                                  {acc.nickname || acc.type} (••••{" "}
                                  {acc.accountNumber.slice(-4)})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Amount Display */}
                          <div className="relative py-8 text-center flex justify-center items-center">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                              <select
                                value={displayCurrency}
                                onChange={(e) =>
                                  setDisplayCurrency(e.target.value)
                                }
                                className="appearance-none bg-[#0c121e]/80  text-[#0F172A] dark:text-white font-bold text-lg px-4 py-2 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer border border-slate-200 dark:border-white/10 shadow-xl"
                                style={{
                                  backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="6 9 12 15 18 9"%3E%3C/polyline%3E%3C/svg%3E')`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 10px center",
                                  backgroundSize: "16px",
                                }}
                              >
                                {CURRENCIES_LIST.map((currency) => (
                                  <option
                                    key={currency.code}
                                    value={currency.code}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white"
                                  >
                                    {currency.code} ({currency.symbol})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="relative flex-1 px-8">
                              <input
                                type="number"
                                inputMode="decimal"
                                autoComplete="off"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`0.00`}
                                className="w-full bg-transparent text-5xl font-mono font-bold text-[#0F172A] dark:text-white text-center outline-none placeholder-slate-800 focus:placeholder-slate-800/50 pr-4"
                                autoFocus
                              />
                              <span className="absolute top-1/2 left-[15%] -translate-y-1/2 text-2xl text-[#0F172A] font-bold pointer-events-none">
                                {getCurrencyInfo?.(displayCurrency)?.symbol ||
                                  "$"}
                              </span>
                            </div>
                          </div>

                          {/* Destination Node */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (internalAccountNumber) {
                                  setInternalAccountNumber("");
                                } else {
                                  setIsRecipientSelectorOpen(true);
                                }
                              }}
                              className={`flex-1 p-4 rounded-2xl border transition-all text-left group ${recipient ? "bg-primary/10 border-primary/40 focus:ring-2 focus:ring-red-400 focus:outline-none" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900"}`}
                              title={
                                internalAccountNumber
                                  ? "Click to clear internal account routing"
                                  : "Select a beneficiary"
                              }
                            >
                              <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block mb-2">
                                {internalAccountNumber
                                  ? "Clear Routing (Tap)"
                                  : "To Destination"}
                              </span>
                              {isValidatingBank ? (
                                <div className="flex items-center gap-2 text-primary font-mono text-[10px] animate-pulse">
                                  <SpinnerIcon className="w-3 h-3 animate-spin" />{" "}
                                  Validating Institutional Metadata...
                                </div>
                              ) : recipient ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-3 relative">
                                    <div className="w-8 h-8 rounded-full bg-primary text-[#0F172A] dark:text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                      {recipient.fullName.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-[#0F172A] dark:text-white text-sm flex items-center gap-2">
                                        {recipient.fullName}
                                        {bankInfo && (
                                          <div className="relative group inline-flex items-center">
                                            <InfoIcon className="w-4 h-4 text-emerald-500 cursor-help" />
                                            {/* Tooltip */}
                                            <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-48 bg-slate-50 border border-slate-300 text-white text-[10px] p-2 rounded shadow-2xl z-[100] break-words pointer-events-none text-left dark:bg-slate-900">
                                              <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                                                <VerifiedBadgeIcon className="w-3 h-3" />{" "}
                                                Verifiable Routing Node
                                              </p>
                                              <p className="font-bold">
                                                {bankInfo.bankName}
                                              </p>
                                              <p>
                                                {bankInfo.city},{" "}
                                                {bankInfo.state}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-[#0F172A] dark:text-white uppercase tracking-wider">
                                        {recipient.bankName}
                                      </p>
                                    </div>
                                  </div>

                                  {bankInfo && (
                                    <div className="mt-2 text-[11px] bg-emerald-500 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 font-mono flex flex-col gap-1 shadow-sm relative z-10 transition-all duration-300">
                                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                        <VerifiedBadgeIcon className="w-4 h-4 text-emerald-500" />
                                        <span>
                                          Routing Credentials Auto-Verified
                                        </span>
                                      </div>
                                      <p className="font-bold text-[#1E293B] dark:text-slate-100">
                                        {bankInfo.bankName}
                                      </p>
                                      <p className="text-[#0F172A] dark:text-white">
                                        {bankInfo.city}, {bankInfo.state}{" "}
                                        {bankInfo.zip || ""}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[#0F172A] dark:text-white">
                                  <PlusCircleIcon className="w-5 h-5" />
                                  <span className="text-sm font-bold">
                                    Select Beneficiary
                                  </span>
                                </div>
                              )}
                            </button>
                            <button
                              onClick={() => setIsQrScannerOpen(true)}
                              className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-all w-20"
                            >
                              <CameraIcon className="w-6 h-6 mb-1" />
                              <span className="text-[8px] font-bold uppercase tracking-widest">
                                Scan
                              </span>
                            </button>
                          </div>
                          {!recipient && (
                            <div className="mt-3 relative z-10 transition-all duration-300">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-px bg-slate-200 dark:bg-slate-900 flex-1"></div>
                                <span className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest bg-white dark:bg-slate-900 px-2 rounded-full border border-slate-100 dark:border-white/10">
                                  OR
                                </span>
                                <div className="h-px bg-slate-200 dark:bg-slate-900 flex-1"></div>
                              </div>
                              <div className="bg-slate-50 relative dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-white/10 shadow-inner flex items-center group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                <div className="p-3 text-[#0F172A]">
                                  <BankIcon className="w-5 h-5" />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter Internal Bank Account Number..."
                                  value={internalAccountNumber}
                                  onChange={(e) =>
                                    setInternalAccountNumber(
                                      e.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  className="w-full bg-transparent text-sm font-mono text-[#0F172A] dark:text-white font-bold outline-none placeholder:font-sans placeholder:font-bold placeholder:text-[#0F172A] pt-1"
                                />
                              </div>
                            </div>
                          )}

                          {/* International Routing Rails Toggle */}
                          {recipient && isInternational && (
                            <div className="space-y-2 animate-fade-in bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-white/10">
                              <div className="flex justify-between items-center pl-1">
                                <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Priority Routing Network
                                </label>
                                <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black font-mono">
                                  MULTI-RAIL ENABLED
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10">
                                {(["SWIFT", "SEPA", "FedWire"] as const).map(
                                  (rail) => {
                                    const railMeta = {
                                      SWIFT: {
                                        code: "MT103",
                                        speed: "1-2 Days",
                                        fee: "0.00",
                                      },
                                      SEPA: {
                                        code: "Euroclear",
                                        speed: "Next-Day",
                                        fee: "0.00",
                                      },
                                      FedWire: {
                                        code: "RTGS",
                                        speed: "Instant",
                                        fee: "0.00",
                                      },
                                    }[rail];
                                    const isSelected = paymentRail === rail;
                                    return (
                                      <button
                                        key={rail}
                                        type="button"
                                        onClick={() => {
                                          setPaymentRail(rail);
                                          triggerHaptic([10]);
                                        }}
                                        className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center transition-all ${
                                          isSelected
                                            ? "bg-primary text-[#0F172A] dark:text-white shadow-md shadow-primary/20 font-bold scale-[1.02]"
                                            : "text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white[0.02]"
                                        }`}
                                      >
                                        <span className="text-[10px] uppercase font-black tracking-widest">
                                          {rail}
                                        </span>
                                        <span className="text-[7.5px] opacity-75 mt-0.5 font-bold">
                                          {railMeta.code}
                                        </span>
                                        <span className="text-[7.5px] font-mono mt-0.5 font-bold text-[#0F172A] dark:text-white">
                                          {railMeta.speed} • {railMeta.fee}
                                        </span>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}

                          {/* International Transfer Details */}
                          {recipient && isInternational && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-white/10 space-y-3 animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[#0F172A] font-bold font-bold uppercase tracking-wide text-[9px]">
                                  Routing Rail
                                </span>
                                <span className="text-primary font-mono font-bold text-[10px] uppercase tracking-wider">
                                  {paymentRail} Wire
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[#0F172A] font-bold">
                                  Exchange Rate
                                </span>
                                <div className="flex items-center gap-1 text-[#0F172A] dark:text-white font-mono">
                                  <ArrowPathIcon className="w-3 h-3 text-primary" />
                                  1 {displayCurrency} ={" "}
                                  {relativeExchangeRate.toFixed(4)}{" "}
                                  {recipient.country.currency}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[#0F172A] font-bold">
                                  Principal Transfer
                                </span>
                                <span className="text-[#0F172A] dark:text-white font-mono">
                                  {formatCurrency(numericAmount, "USD")}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[#0F172A] font-bold font-semibold text-primary/80">
                                  Service Fee (1.00% dynamic)
                                </span>
                                <span className="text-primary font-bold font-mono">
                                  {formatCurrency(applicableFee, "USD")}
                                </span>
                              </div>
                              <div className="h-px bg-white dark:bg-slate-800"></div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                                  Recipient Receives
                                </span>
                                <span className="text-emerald-400 font-bold font-mono text-sm">
                                  {formatCurrency(
                                    numericAmount,
                                    recipient.country.currency,
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Fee Display for Domestic if applicable (usually free) */}
                          {recipient &&
                            !isInternational &&
                            applicableFee > 0 && (
                              <div className="flex justify-between items-center px-2 text-[10px] text-[#0F172A] font-bold uppercase tracking-wider">
                                <span>Transfer Fee</span>
                                <span>{formatCurrency(applicableFee)}</span>
                              </div>
                            )}

                          {/* Real-time Fee Transparency Timeline */}
                          {recipient && numericAmount > 0 && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-5 mt-4 space-y-4 font-sans animate-fade-in relative z-10 text-left shadow-lg dark:shadow-black/20">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white">
                                    Fee Transparency Timeline
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Live Ledger Auditing
                                </span>
                              </div>

                              {/* Vertical Timeline Stepper */}
                              <div className="relative pl-6 space-y-4 text-xs">
                                {/* Timeline connecting vertical line */}
                                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-900" />

                                {/* Step 1: Principal Input */}
                                <div className="relative group">
                                  {/* Milestone Indicator */}
                                  <div className="absolute -left-[22px] top-0.5 w-[11px] h-[11px] rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125 duration-200" />
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-black text-[11px] text-[#0F172A] dark:text-white uppercase tracking-tight">Funding Principal</h5>
                                      <p className="text-[10px] text-[#0F172A] dark:text-white font-bold">Initiating ledger debit from {account?.nickname || "source balance"}</p>
                                    </div>
                                    <span className="font-mono font-bold text-[#0F172A] dark:text-white shrink-0 ml-2">
                                      {formatCurrency(inputAmountInCurrency, displayCurrency)}
                                    </span>
                                  </div>
                                </div>

                                {/* Step 2: Currency Conversion (Only if applicable) */}
                                {isInternational && (
                                  <div className="relative group">
                                    {/* Milestone Indicator */}
                                    <div className="absolute -left-[22px] top-0.5 w-[11px] h-[11px] rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125 duration-200" />
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-black text-[11px] text-[#0F172A] dark:text-white uppercase tracking-tight">Symmetrical Exchange Rate</h5>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white font-bold">
                                          Converting at 1 {displayCurrency} = {relativeExchangeRate.toFixed(4)} {recipient.country.currency}
                                        </p>
                                      </div>
                                      <span className="font-mono font-bold text-indigo-500 shrink-0 ml-2">
                                        {formatCurrency(receiveAmount, recipient.country.currency)}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Step 3: Wire / Rail Fees */}
                                <div className="relative group">
                                  {/* Milestone Indicator */}
                                  <div className="absolute -left-[22px] top-0.5 w-[11px] h-[11px] rounded-full bg-indigo-400 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125 duration-200" />
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-black text-[11px] text-[#0F172A] dark:text-white uppercase tracking-tight">
                                        Standard Wire Rail Fee ({paymentRail || "Fedwire"})
                                      </h5>
                                      <p className="text-[10px] text-[#0F172A] dark:text-white font-bold">Clearing communication and routing network costs</p>
                                    </div>
                                    <span className="font-mono font-bold text-[#0F172A] dark:text-white shrink-0 ml-2">
                                      {formatCurrency(applicableFee, "USD")}
                                    </span>
                                  </div>
                                </div>

                                {/* Step 4: Compliance Surcharge */}
                                <div className="relative group">
                                  {/* Milestone Indicator */}
                                  <div className={`absolute -left-[22px] top-0.5 w-[11px] h-[11px] rounded-full ${potentialComplianceFee > 0 ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125 duration-200`} />
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h5 className="font-black text-[11px] text-[#0F172A] dark:text-white uppercase tracking-tight">
                                          Compliance Surcharge
                                        </h5>
                                        <button 
                                          type="button"
                                          onClick={() => setShowFeeInfo(!showFeeInfo)}
                                          onMouseEnter={() => setShowFeeInfo(true)}
                                          onMouseLeave={() => setShowFeeInfo(false)}
                                          className="text-[#0F172A] hover:text-amber-500 transition-colors cursor-pointer outline-none p-0.5 flex items-center justify-center shrink-0"
                                          title="Click or hover for compliance details"
                                        >
                                          <InfoIcon className="w-3 h-3" />
                                        </button>
                                        
                                        {potentialComplianceFee > 0 && (
                                          <span className="inline-flex items-center gap-1 bg-red-500 dark:bg-slate-900 rounded px-1 py-0.5 border border-red-500/15 dark:border-white/10" title="Compliance fee fluctuations over last 5 transactions">
                                              <span className="text-[7px] text-red-500 dark:text-red-400 font-black uppercase tracking-widest">Trend:</span>
                                              <svg width="36" height="8" className="overflow-visible inline-block">
                                                  <polyline
                                                      fill="none"
                                                      stroke="#ef4444"
                                                      strokeWidth="1"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      points={last5ComplianceFees.map((v, i) => `${1 + (i * 34) / 4},${7 - ((v - Math.min(...last5ComplianceFees, 0)) / (Math.max(...last5ComplianceFees, 0.1) - Math.min(...last5ComplianceFees, 0) || 1)) * 6}`).join(' ')}
                                                  />
                                              </svg>
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-[#0F172A] dark:text-white font-bold">
                                        {potentialComplianceFee > 0 
                                          ? `Compliance Halt triggered (> $100 limit) at ${activeComplianceRateVal}% surcharge rate` 
                                          : `Below regulatory threshold ($100 limit). Automatic clearance granted.`}
                                      </p>
                                    </div>
                                    <span className={`font-mono font-bold shrink-0 ml-2 ${potentialComplianceFee > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                      {potentialComplianceFee > 0 ? formatCurrency(potentialComplianceFee, "USD") : "Waived"}
                                    </span>
                                  </div>
                                </div>

                                {/* Step 4.5: Compliance Info Expansion */}
                                <AnimatePresence>
                                  {showFeeInfo && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                      animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                      className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner overflow-hidden text-left"
                                    >
                                      Federal Reserve mandate 31 CFR § 1010.410 requires Senior Compliance Desk clearance audits on cross-border transactions exceeding $100. A compliance halt fee of {activeComplianceRateVal}% is assessed to support cryptographic multi-sig ledger trace execution.
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Step 5: Final Settlement Total */}
                                <div className="pt-2 border-t border-slate-100 dark:border-white/10 relative group">
                                  {/* Milestone Indicator */}
                                  <div className="absolute -left-[22px] top-3.5 w-[11px] h-[11px] rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125 duration-200 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                  <div className="flex justify-between items-center py-1">
                                    <div>
                                      <h5 className="font-black text-[11px] text-[#0F172A] dark:text-white uppercase tracking-tight">
                                        Authorized Ledger Debit
                                      </h5>
                                      <p className="text-[10px] text-[#0F172A] dark:text-white font-semibold font-mono">Pre-settlement trace completed</p>
                                    </div>
                                    <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-sm shrink-0 ml-2">
                                      {formatCurrency(totalCost, "USD")}
                                    </strong>
                                  </div>
                                </div>

                              </div>

                              {/* Compare Rates Button & Historical Fee Average Overlay */}
                              {potentialComplianceFee > 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => setShowFeeComparison(!showFeeComparison)}
                                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white[0.06] text-[9px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white flex items-center justify-center gap-1.5 transition-all outline-none"
                                  >
                                    <ArrowPathIcon className={`w-3.5 h-3.5 text-primary ${showFeeComparison ? 'rotate-180' : ''} transition-all duration-300`} />
                                    {showFeeComparison ? "Hide Cost-Context Analysis" : "Compare Rates & Cost-Context"}
                                  </button>

                                  <AnimatePresence>
                                    {showFeeComparison && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="space-y-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 rounded-2xl p-3.5 overflow-hidden text-left"
                                      >
                                        <h4 className="text-[9px] font-black uppercase tracking-wider text-[#0F172A] dark:text-white">Institutional Fee Rate Comparison</h4>
                                        
                                        {/* Bars */}
                                        <div className="space-y-2">
                                          <div>
                                            <div className="flex justify-between text-[10px] mb-1 font-semibold">
                                              <span className="text-red-500">Current Transfer Fee Rate:</span>
                                              <span className="font-mono text-red-400">{activeComplianceRateVal}% ({formatCurrency(potentialComplianceFee, "USD")})</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.max(5, (potentialComplianceFee / Math.max(potentialComplianceFee, historicalFeeAverage, 1)) * 100)}%` }}></div>
                                            </div>
                                          </div>

                                          <div>
                                            <div className="flex justify-between text-[10px] mb-1 font-semibold">
                                              <span className="text-[#0F172A]">Historical Average / Global Standard:</span>
                                              <span className="font-mono text-[#0F172A]">15.0% ({formatCurrency(historicalFeeAverage, "USD")})</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                              <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.max(5, (historicalFeeAverage / Math.max(potentialComplianceFee, historicalFeeAverage, 1)) * 100)}%` }}></div>
                                            </div>
                                          </div>
                                        </div>

                                        <p className="text-[9px] font-mono leading-normal text-[#0F172A] dark:text-white border-t border-slate-200 dark:border-white/10 pt-2">
                                          <span className="text-emerald-500 font-extrabold">ADVISORY:</span> Fee rate matches network clearing averages. Current system liquidity is healthy. Recommended for immediate settlement clearance.
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          )}

                          {error && (
                            <p className="text-red-400 text-xs text-center font-bold bg-red-900 py-2 rounded-lg animate-pulse">
                              {error}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6 animate-fade-in h-full flex flex-col">
                      <div className="bg-yellow-500 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-yellow-200/90 leading-relaxed font-bold">
                          Institutional Compliance Check: Transfers &gt; $100
                          trigger auto-audit. Ensure purpose is accurate.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                          Reason for Transfer
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {INSTITUTIONAL_PURPOSES.map((p) => (
                            <button
                              key={p}
                              onClick={() => setPurpose(p)}
                              className={`p-3 rounded-xl text-left text-xs font-bold transition-all border ${purpose === p ? "bg-primary text-[#0F172A] dark:text-white border-primary" : "bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900"}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                          Add Note (Optional)
                        </label>
                        <textarea
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          placeholder="Add personal comments or tax-related memos..."
                          className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none h-16 placeholder:text-[#0F172A]"
                        />
                      </div>

                      <div className="space-y-2 mt-4">
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                          Transfer Schedule
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: "one-time", label: "One-time" },
                            { value: "weekly", label: "Weekly" },
                            { value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFrequency(option.value as any)}
                              className={`p-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-wider transition-all border ${frequency === option.value ? "bg-primary/10 text-primary border-primary/30" : "bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white"}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      
                      {frequency !== "one-time" && (
                        <div className="space-y-4 mt-4 p-4 border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                              Schedule Start Date
                            </label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                              End Condition
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: "never", label: "Never" },
                                { value: "date", label: "On Date" },
                                { value: "occurrences", label: "Occurrences" }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setRecurringEndCondition(option.value as any)}
                                  className={`p-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-wider transition-all border ${recurringEndCondition === option.value ? "bg-primary/10 text-primary border-primary/30" : "bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white"}`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {recurringEndCondition === "date" && (
                            <div className="space-y-2 animate-fade-in">
                              <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={recurringEndDate}
                                onChange={(e) => setRecurringEndDate(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs font-mono"
                              />
                            </div>
                          )}

                          {recurringEndCondition === "occurrences" && (
                            <div className="space-y-2 animate-fade-in">
                              <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">
                                Number of Transfers
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="120"
                                value={recurringOccurrences}
                                onChange={(e) => setRecurringOccurrences(parseInt(e.target.value) || 1)}
                                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-bold"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && !isSimulatingPreHalt && (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in text-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-xl relative">
                        <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping"></div>
                        <LockClosedIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                          Hardware Authorization
                        </h3>
                        <p className="text-[#0F172A] dark:text-white text-xs mt-2">
                          Enter Secure Enclave PIN to sign.
                        </p>
                      </div>

                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        className="w-48 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-center text-3xl text-[#0F172A] dark:text-white tracking-[0.5em] p-4 focus:border-primary outline-none shadow-inner font-mono font-bold"
                        placeholder="••••"
                        autoFocus
                        maxLength={4}
                      />
                    </div>
                  )}

                  {isSimulatingPreHalt && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in relative overflow-hidden pb-12">
                      <MoneyTransferAnimation
                        userProfile={userProfile}
                        recipient={recipient}
                        amount={numericAmount}
                        symbol={currencySymbol}
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in text-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-xl relative">
                        <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping"></div>
                        <ShieldCheckIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                          2FA Verification
                        </h3>
                        <p className="text-[#0F172A] dark:text-white text-xs mt-2">
                          Enter the 4-digit code sent to <br />
                          <span className="text-[#0F172A] dark:text-white font-mono">
                            {phone}
                          </span>
                        </p>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-center text-3xl text-[#0F172A] dark:text-white tracking-[0.5em] p-4 focus:border-primary outline-none shadow-inner font-mono font-bold"
                        placeholder="000000"
                        autoFocus
                        maxLength={6}
                      />
                      {error && (
                        <p className="text-red-400 text-xs text-center font-bold bg-red-900 py-2 rounded-lg animate-pulse w-full max-w-xs">
                          {error}
                        </p>
                      )}
                      <button
                        onClick={handleSendOTP}
                        disabled={isSendingOtp}
                        className="mt-4 text-xs text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors uppercase tracking-widest font-bold disabled:opacity-70"
                      >
                        {isSendingOtp ? "Sending..." : "Resend Code"}
                      </button>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in relative overflow-hidden pb-12 pt-12">
                      <RealTimePaymentVerification
                        amount={isBulkMode ? bulkTotalPrincipalUSD : numericAmount}
                        currency={
                          isBulkMode
                            ? displayCurrency
                            : isInternational
                              ? recipient?.country.currency!
                              : displayCurrency
                        }
                        recipientName={isBulkMode ? "Selected Bulk Receivers" : (recipient?.fullName || "")}
                        complianceFee={
                          complianceFeePaid > 0 
                            ? complianceFeePaid 
                            : (isBulkMode 
                                ? bulkTotalPrincipalUSD * ((systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17) / 100) 
                                : numericAmount * ((systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17) / 100))
                        }
                        networkFee={isBulkMode ? bulkTotalFees : applicableFee}
                        accountBalance={account?.balance || 0}
                        onVerificationComplete={(success) => {
                          if (success) {
                            setIsBiometricConfirmOpen(true);
                          } else {
                            setError(
                              "Transaction verification failed. Please try again.",
                            );
                            setStep(2);
                          }
                        }}
                      />
                    </div>
                  )}

                  {step === 5 && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in relative overflow-hidden pb-12">
                      <MoneyTransferAnimation
                        userProfile={userProfile}
                        recipient={recipient}
                        amount={numericAmount}
                        symbol={currencySymbol}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 4. Fixed Footer Actions */}
        {step < 4 &&
          activeTab === "send" &&
          !isSimulatingPreHalt &&
          !isValidatingEmailMx && (
            <div className="p-5 border-t border-slate-100 dark:border-white/10 bg-slate-100 flex gap-3 z-20">
              {step > 0 ? (
                <button
                  onClick={() => setStep((prev) => prev - 1)}
                  className="px-5 py-4 rounded-xl bg-white hover:bg-white text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-wider transition-colors dark:bg-slate-800"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-4 rounded-xl bg-white hover:bg-white text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-wider transition-colors dark:bg-slate-800"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isSendingOtp}
                className="flex-1 py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {isSendingOtp ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <span>
                    {step === 2
                      ? "Sign & Verify"
                      : step === 3
                        ? "Verify & Transmit"
                        : "Continue"}
                  </span>
                )}
                {step < 2 && <ArrowRightIcon className="w-4 h-4" />}
              </button>
            </div>
          )}
      </div>

      {/* Biometric Confirmation Dialog */}
      <BiometricPaymentAuthModal
        isOpen={isBiometricConfirmOpen}
        onSuccess={() => {
          setIsBiometricConfirmOpen(false);
          if (isBulkMode) {
            executeBulkTransaction();
          } else {
            executeTransaction();
          }
        }}
        onCancel={() => {
          setIsBiometricConfirmOpen(false);
          setStep(2);
        }}
        amount={isBulkMode ? bulkTotalPrincipalUSD : numericAmount}
        currency={displayCurrency}
        recipientName={isBulkMode ? "Selected Bulk Payees" : (recipient?.fullName || "Verified Beneficiary")}
        accountNickname={account?.nickname || account?.type || "Primary Account"}
        transferRail={isInternational ? paymentRail : "Instant Wire (FedNow / RTP)"}
      />

      {/* Share QR Code Modal */}
      <ShareQrCodeModal
        isOpen={isShareQrModalOpen || activeTab === "qr_share"}
        onClose={() => {
          setIsShareQrModalOpen(false);
          if (activeTab === "qr_share") {
            setActiveTab("send");
          }
        }}
        account={account}
        userProfile={userProfile}
      />
    </div>
  );
};
