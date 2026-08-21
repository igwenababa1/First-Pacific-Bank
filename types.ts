
import React from 'react';

export type View = 'dashboard' | 'send' | 'split' | 'deposit' | 'recipients' | 'history' | 'security' | 'cards' | 'insurance' | 'loans' | 'support' | 'accounts' | 'crypto' | 'services' | 'checkin' | 'platform' | 'tasks' | 'flights' | 'utilities' | 'integrations' | 'advisor' | 'invest' | 'atmLocator' | 'quickteller' | 'qrScanner' | 'privacy' | 'wire' | 'about' | 'contact' | 'wallet' | 'digital-store' | 'network' | 'ratings' | 'globalAid' | 'alerts' | 'logistics' | 'careers' | 'profile' | 'admin' | 'multisig' | 'mobile-app' | 'inbox' | 'casino';

export type BalanceDisplayMode = 'global' | 'domestic';

export enum TransactionStatus {
  SUBMITTED = 'Submitted',
  CONVERTING = 'In FX Conversion',
  PAUSED_ON_HOLD = 'Paused / On Hold',
  AWAITING_AUTHORIZATION = 'Pending Authorization',
  FLAGGED_AWAITING_CLEARANCE = 'Flagged for Review',
  CLEARANCE_GRANTED = 'Clearance Granted',
  IN_TRANSIT = 'Sent to Network',
  FUNDS_ARRIVED = 'Funds Arrived',
  PENDING_DEPOSIT = 'Pending Deposit',
  FAILED = 'Failed',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  REVERSED = 'Reversed',
  REFUNDED = 'Refunded',
  CANCELLED = 'Cancelled',
  REJECTED = 'Rejected',
  AWAITING_PAYMENT_VERIFICATION = 'Awaiting Payment Verification',
}

// Logistics Types
export enum ShipmentStatus {
  PICKED_UP = 'Picked Up',
  IN_TRANSIT = 'In Transit',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered'
}

export type StatusHealth = 'on-time' | 'delayed' | 'early';

export interface ShipmentEvent {
    status: string;
    location: string;
    timestamp: string;
    type?: 'flight' | 'warehouse' | 'truck' | 'package';
}

export interface Shipment {
    trackingId: string;
    currentStatus: ShipmentStatus;
    statusHealth: StatusHealth;
    serviceType: string;
    weight: string;
    assetVisuals?: string[];
    estimatedTime: string;
    estimatedDate: string;
    deliveryWindow?: string;
    dimensions: string;
    signatureRequired: boolean;
    insuranceValue: string;
    sealNumber: string;
    events: ShipmentEvent[];
    recipient: string;
    recipientPhoto: string;
    recipientAddress: {
        street: string;
        city: string;
        zip: string;
    };
    deliveryInstructions: string;
    handlingProtocols: string[];
    certifiedBy: string;
    blockchainHash: string;
}

export enum CustomerGroup {
  ALL = 'all',
  NEW_USERS = 'new_users',
  FREQUENT_SENDERS = 'frequent_senders',
}

export enum NotificationType {
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  CARD = 'card',
  LOAN = 'loan',
  CRYPTO = 'crypto',
  SUBSCRIPTION = 'subscription',
  TRAVEL = 'travel',
  TASK = 'task',
  INSURANCE = 'insurance',
  ACCOUNT = 'account',
  SUPPORT = 'support',
  ALERT = 'alert',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  linkTo?: View;
}

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  code?: string;
  isQrPay?: boolean;
  merchantName?: string;
  amount?: number;
  date?: string;
  transactionId?: string;
  category?: string;
}

export interface PushNotificationSettings {
    transactions: boolean;
    security: boolean;
    promotions: boolean;
    alertOnAmountEnabled?: boolean;
    alertAmountThreshold?: number;
    alertOnFlaggedEnabled?: boolean;
    alertOnComplianceFeeEnabled?: boolean;
    complianceFeeThresholdPercentage?: number;
}

export interface PrivacySettings {
    ads: boolean;
    sharing: boolean;
    email: {
        transactions: boolean;
        security: boolean;
        promotions: boolean;
    };
    sms: {
        transactions: boolean;
        security: boolean;
        promotions: boolean;
    };
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  symbol: string;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    countryCode: string;
}

export interface DeliveryOptions {
  bankDeposit: boolean;
  cardDeposit: boolean;
  cashPickup: boolean;
}

export interface RealAccountDetails {
  accountNumber: string;
  swiftBic: string;
  routingNumber?: string;
  intermediaryBank?: string;
  bankAddress?: string;
}

export type PaymentMethodType = 'BANK' | 'PAYPAL' | 'CASHAPP' | 'ZELLE' | 'WESTERN_UNION' | 'MONEYGRAM' | 'VENMO' | 'WISE' | 'REVOLUT' | 'CHIME' | 'CITI' | 'CAPITAL_ONE' | 'CHASE' | 'BOA' | string;

export interface Recipient {
  id: string;
  userId?: string;
  fullName: string;
  nickname?: string;
  bankName: string;
  accountNumber: string; // Masked account number or service identifier for display
  country: Country;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  deliveryOptions?: DeliveryOptions;
  realDetails: RealAccountDetails;
  recipientType?: 'bank' | 'service';
  serviceName?: 'PayPal' | 'CashApp' | 'Zelle' | 'Western Union' | 'MoneyGram' | string;
  paymentMethod?: PaymentMethodType;
  serviceIdentifier?: string; // e.g. email, cashtag, phone
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  trustScore?: number;
  lastPaymentDate?: Date;
  isFavorite?: boolean;
  category?: 'Family' | 'Friends' | 'Business' | 'International' | 'Other' | string;
  payeeType?: 'individual' | 'business';
  routingNumber?: string;
}

// --- ADVANCED BANKING TYPES ---

/**
 * Standardized Payment Rails for routing logic.
 */
export type PaymentRail = 
  | 'ACH'               // Automated Clearing House (US Domestic)
  | 'WIRE_FEDWIRE'      // FedWire (US Real-Time)
  | 'WIRE_CHIPS'        // CHIPS (US High Value)
  | 'SWIFT_GPI'         // Global Payments Innovation (International)
  | 'SEPA_INSTANT'      // Single Euro Payments Area (EU)
  | 'RTP'               // Real-Time Payments (The Clearing House)
  | 'INTERNAL_BOOK'     // On-us transfer
  | 'BLOCKCHAIN_SETTLE' // Crypto Bridge
  | 'CARD_NETWORK';     // Visa/MC Push

/**
 * ISO 20022 Purpose Codes for transaction categorization.
 */
export type ISOPurposeCode = 
  | 'SALA' // Salary / Payroll
  | 'INTC' // Intra-company transfer
  | 'SUPP' // Family Support
  | 'GDDS' // Purchase of Goods
  | 'SCVE' // Purchase of Services
  | 'INVS' // Investment / Securities
  | 'CHAR' // Charity
  | 'TAXE' // Tax Payment
  | 'RENT' // Rent
  | 'DIVI' // Dividends
  | 'UTL'; // Utilities

/**
 * Detailed Originator information required for FATF Travel Rule compliance.
 */
export interface OriginatorDetails {
    legalName: string;
    address?: string; // Physical address required for wire transfers > $3k
    city?: string;
    countryCode?: string;
    accountNumberMasked?: string;
    financialInstitution?: string;
}

/**
 * Technical clearing data for audit trails.
 */
export interface SettlementInfo {
    traceId?: string; // IMAD/OMAD for Wire
    uetr?: string; // Unique End-to-End Transaction Reference (SWIFT)
    clearingSystemRef?: string;
    valueDate?: string;
}

export interface CreateTransactionInput {
  accountId: string;
  recipient?: Recipient;
  sendAmount: number;
  receiveAmount?: number;
  fee?: number;
  complianceFee?: number;
  exchangeRate?: number;
  foreignExchangeRate?: number;
  type?: 'debit' | 'credit' | 'send' | 'receive' | 'transfer' | 'wire' | 'payment' | string;
  description?: string;
  purpose?: string;
  deliverySpeed?: 'Standard' | 'Express';
  deliveryMethod?: 'Bank Deposit' | 'Card Deposit' | 'Cash Pickup';
  transferMethod?: PaymentRail | string;
  paymentMethod?: PaymentMethodType;
  estimatedArrival?: Date;
  referenceNumber?: string;
  category?: SpendingCategory | string;
  originalInputAmount?: number;
  originalInputCurrencyCode?: string;
  authCode?: string;
  [key: string]: any;
}

export interface Transaction {
  id: string;
  accountId: string; // The ID of the source/destination account
  recipient: Recipient;
  
  // Amounts
  sendAmount: number;
  receiveAmount: number;
  receiveCurrency?: string;
  fee: number;
  complianceFee?: number;
  exchangeRate: number;
  foreignExchangeRate?: number;
  baseCurrency?: string;
  quotedCurrency?: string;
  originalInputAmount?: number;
  originalInputCurrencyCode?: string;

  // Delivery & Method
  deliverySpeed?: 'Standard' | 'Express';
  deliveryMethod?: 'Bank Deposit' | 'Card Deposit' | 'Cash Pickup';
  transferMethod?: PaymentRail | string; // Updated to support PaymentRail type
  paymentMethod?: PaymentMethodType;
  
  // Status
  status: TransactionStatus;
  estimatedArrival: Date;
  statusTimestamps: {
    [TransactionStatus.SUBMITTED]: Date;
    [TransactionStatus.CONVERTING]?: Date;
    [TransactionStatus.AWAITING_AUTHORIZATION]?: Date;
    [TransactionStatus.FLAGGED_AWAITING_CLEARANCE]?: Date;
    [TransactionStatus.CLEARANCE_GRANTED]?: Date;
    [TransactionStatus.IN_TRANSIT]?: Date;
    [TransactionStatus.FUNDS_ARRIVED]?: Date;
    [TransactionStatus.PENDING_DEPOSIT]?: Date;
    [TransactionStatus.FAILED]?: Date;
    [TransactionStatus.PROCESSING]?: Date;
    [TransactionStatus.COMPLETED]?: Date;
    [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]?: Date;
    [TransactionStatus.PAUSED_ON_HOLD]?: Date;
    [TransactionStatus.REVERSED]?: Date;
    [TransactionStatus.REFUNDED]?: Date;
    [key: string]: Date | undefined;
  };

  // Content
  description: string;
  isRecurring?: boolean;
  recurringDetails?: {
    frequency: "weekly" | "monthly" | "quarterly";
    startDate: string;
    endCondition: "never" | "date" | "occurrences";
    endDate?: string;
    occurrences?: number;
  };
  type: 'debit' | 'credit';
  category?: SpendingCategory;
  tags?: string[];
  syncState?: 'synced' | 'pending';
  confidence?: number;
  
  // Enhanced Purpose & Originator
  purpose?: string; // Human readable
  purposeCode?: ISOPurposeCode | string; // Machine readable
  senderName?: string; // Simple string for UI
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientAccount?: string;
  referenceNumber?: string;
  createdAt?: string;
  timestamp?: string;
  senderDetails?: OriginatorDetails; // Detailed object for compliance
  
  // Enhanced Settlement
  settlementDetails?: SettlementInfo; // IMAD, UETR, etc.

  // Compliance
  requiresAuth?: boolean;
  reviewed?: boolean;
  regulatoryAuthCode?: string; // Compliance/OFAC code
  
  // Legacy / Specifics
  chequeDetails?: {
    chequeNumber: string;
    images: {
      front: string;
      back: string;
    }
  };
  splitGroupId?: string;
  
  // Details Object (Deprecated but kept for compatibility)
  transactionDetails?: {
    memo?: string;
    category?: SpendingCategory;
    transferType?: 'wire' | 'service' | 'bank' | string;
    paymentMethod?: PaymentMethodType;
    clearanceFeePaid?: boolean;
    senderName?: string;
    recipientAddress?: string;
    scheduledDate?: string;
    frequency?: string;
  };
  
  // Additional Institutional Data
  traceId?: string; // Alias for settlementDetails.traceId
  correspondentBank?: string; // Intermediary bank for international wires
  remittanceInformation?: string; // ISO 20022 Unstructured
  clearanceFeePaid?: boolean;
  recipientAddress?: string;
  scheduledDate?: string;
  frequency?: string;
  isAdjustment?: boolean;
  federallyVerified?: boolean;
  paymentProof?: string;
  paymentProofTimestamp?: string;
  verificationRequested?: boolean;
  verifiedAmount?: number;
  adjustmentSourceBank?: string;
  adjustmentAdminEmail?: string;
  presetJustification?: string;
  clearanceCode?: string;
  riskScore?: number;
}

export type SpendingCategory = 'Electronics' | 'Transport' | 'Food & Drink' | 'Groceries' | 'Shopping' | 'Entertainment' | 'Travel' | 'Other';

export interface Card {
  id: string;
  lastFour: string;
  cardholderName: string;
  expiryDate: string;
  fullNumber?: string;
  cvc?: string;
  network: 'Visa' | 'Mastercard' | 'Amex';
  cardType: 'DEBIT' | 'CREDIT';
  linkedAccountId?: string; // for debit cards
  balance?: number; // Specific balance for this card
  creditDetails?: { // for credit cards
    creditLimit: number;
    currentBalance: number;
    statementBalance: number;
    minimumPayment: number;
    paymentDueDate: Date;
    apr: number;
  };
  rewards?: {
    pointsBalance?: number;
    cashBackBalance?: number;
    earnRates: { category: SpendingCategory | 'All'; rate: number; unit: 'points' | '%' }[];
  };
  controls: {
    isFrozen: boolean;
    onlinePurchases: boolean;
    internationalTransactions: boolean;
    transactionLimits?: {
        perTransaction: number | null; // null for no limit
        daily: number | null;
    };
    blockedCategories?: SpendingCategory[];
    travelNotice?: {
        active: boolean;
        countries: string[];
        fromDate: string;
        toDate: string;
    };
  };
}

export interface VirtualCard {
    id: string;
    nickname: string;
    lastFour: string;
    fullNumber: string;
    expiryDate: string;
    cvc: string;
    spendingLimit: number | null; // null for no limit
    spentThisMonth: number;
    lockedToMerchant: string | null;
    isFrozen: boolean; // Deprecated in favor of controls, but kept for compatibility if needed
    linkedCardId: string; // The physical card it's linked to
    controls: {
        isFrozen: boolean;
        onlinePurchases: boolean;
        internationalTransactions: boolean;
        blockedCategories?: SpendingCategory[];
    };
}

export interface CardTransaction {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: SpendingCategory;
    status: 'Posted' | 'Pending';
    rewardsEarned?: {
        points?: number;
        cashBack?: number;
    };
    merchantInfo: {
        name: string;
        logoUrl?: string;
        location?: string; // e.g. "San Francisco, CA"
    };
}

export interface LimitDetail {
  perTransaction?: number | 'Unlimited';
  daily: number | 'Unlimited';
  monthly: number | 'Unlimited';
}

export interface TransferLimits {
  daily: { amount: number; count: number };
  weekly: { amount: number; count: number };
  monthly: { amount: number; count: number };
}

export interface AdvancedTransferLimits {
  p2p: LimitDetail; // e.g., Zelle, CashApp
  ach: LimitDetail; // To/from external bank accounts
  wire: LimitDetail;
  internal: LimitDetail; // Transfers between user's own accounts
}

export interface NewsArticle {
  title: string;
  summary: string;
  category: string;
}

export interface InsuranceProduct {
  name: string;
  description: string;
  benefits: string[];
}

export interface ProxyAccount {
  id: string;
  label: string;
  accountNumber: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  interestRate: {
    min: number;
    max: number;
  };
  maxAmount?: number;
  collateralRequired?: boolean;
}

export enum LoanApplicationStatus {
  PENDING = 'Pending Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ACTIVE = 'Active',
}

export interface LoanApplication {
  id: string;
  loanProduct: LoanProduct;
  amount: number;
  term: number; // in months
  status: LoanApplicationStatus;
  submittedDate: Date;
  collateralAsset?: string; // e.g., 'BTC'
}

export interface SupportTopic {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SystemUpdate {
  id: string;
  title: string;
  date: string;
  description: string;
  category: 'New Feature' | 'Improvement' | 'Maintenance';
}

export enum AccountType {
  CHECKING = 'Global Checking',
  SAVINGS = 'High-Yield Savings',
  BUSINESS = 'Business Pro',
  EXTERNAL_LINKED = 'External Linked Account',
  JOINT = 'Joint Reserve',
}

export enum VerificationLevel {
  UNVERIFIED = 'Unverified',
  LEVEL_1 = 'Level 1: SSN Verified',
  LEVEL_2 = 'Level 2: Document Verified',
  LEVEL_3 = 'Level 3: Liveness Verified',
}

export interface Account {
  id: string;
  type: AccountType;
  nickname?: string;
  accountNumber: string; // Masked
  fullAccountNumber?: string;
  routingNumber?: string;
  swiftBic?: string;
  iban?: string;
  balance: number;
  currency?: string;
  features: string[];
  status?: 'Active' | 'Provisioning' | 'Under Review' | 'Pending Verification' | 'Suspended';
  parentId?: string;
}

// Crypto-specific types
export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  icon: React.ComponentType<{ className?: string }>;
  price: number;
  change24h: number;
  marketCap: number;
  priceHistory: number[];
}

export interface CryptoHolding {
  assetId: string;
  amount: number;
  avgBuyPrice: number;
  stakedAmount?: number;
  stakingApr?: number;
  stakingLockedUntil?: string;
}

export interface Order {
    price: number;
    size: number;
}

export interface Trade {
    id: string;
    price: number;
    size: number;
    time: string;
    type: 'buy' | 'sell';
}

// Services and Subscriptions
export enum SubscriptionServiceType {
    INTERNET = 'Internet',
    TV = 'TV',
    SATELLITE = 'Satellite',
}

export interface SubscriptionService {
    id: string;
    provider: string;
    plan: string;
    amount: number;
    dueDate: Date;
    type: SubscriptionServiceType;
    isPaid: boolean;
}

export interface SpendingLimit {
    category: SpendingCategory;
    limit: number; // The monthly limit in USD
}

export interface AppleCardDetails {
    lastFour: string;
    balance: number;
    creditLimit: number;
    availableCredit: number;
    spendingLimits: SpendingLimit[];
}

export interface AppleCardTransaction {
    id: string;
    vendor: string;
    category: SpendingCategory;
    amount: number;
    date: Date;
}

// Travel Check-In
export enum TravelPlanStatus {
    UPCOMING = 'Upcoming',
    ACTIVE = 'Active',
    COMPLETED = 'Completed',
}

export interface TravelPlan {
    id: string;
    country: Country;
    startDate: Date;
    endDate: Date;
    status: TravelPlanStatus;
    flightNumber?: string;
    airline?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    selectedCardIds?: string[];
    autoCurrencyConversion?: boolean;
    travelReason?: 'business' | 'leisure' | 'relocation' | 'other';
}

// Security
export interface SecuritySettings {
  mfa: {
    enabled: boolean;
    method: 'sms' | 'app' | 'whatsapp' | null;
  };
  biometricsEnabled: boolean;
  transactionMonitoringEnabled: boolean;
  darkWebMonitoringEnabled: boolean;
  forceLockEnabled?: boolean;
  forceLockTimeout?: number;
  travelModeEnabled?: boolean;
  registeredHomeRegion?: string;
  geofenceAlertsEnabled?: boolean;
  geofenceSensitivityKm?: number;
  currentDetectedRegion?: string;
  lastLocationCheckTimestamp?: string;
}

export interface TrustedDevice {
  id: string;
  deviceType: 'desktop' | 'mobile';
  browser: string;
  location: string;
  lastLogin: Date;
  isCurrent: boolean;
}

export type UserRole = 'user' | 'admin' | 'super_admin';
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  position?: string;
  requiresJointForm?: boolean;
  sex?: string;
  profilePictureUrl: string;
  bankIdNumber?: string;
  customBanner?: string;
  role?: UserRole;
  kycStatus?: KycStatus;
  emailVerified?: boolean;
  accountStatus?: 'pending_verification' | 'active' | 'rejected' | 'suspended';
  registrationSubmittedAt?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  dateOfBirth?: string;
  kycData?: {
    documentUrl?: string;
    selfieUrl?: string;
    address?: string;
    submittedAt?: Date | string;
    documentType?: string;
    frontImage?: string;
    backImage?: string;
    selfieImage?: string;
    addressImage?: string;
    extractedData?: any;
    verifiedAt?: Date | string;
    auditHash?: string;
  };
  lastLogin: {
    date: Date;
    from: string; // e.g., 'New York, NY'
  };
  isBanned?: boolean;
  isSuspended?: boolean;
  isFrozen?: boolean;
  warnings?: string[];
  requireAdminApprovalForPayments?: boolean;
  awaitingPaymentVerificationEnabled?: boolean;
  btcAddress?: string;
  ethAddress?: string;
  paypalEmail?: string;
  cashappTag?: string;
  zelleEmail?: string;
  bankRouting?: string;
  bankAccountNumber?: string;
  disabledPaymentMethods?: string[];
  ssn?: string;
  citizenship?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdExpiry?: string;
  governmentIdBase64?: string;
  employmentStatus?: string;
  sourceOfWealth?: string;
  accountTier?: string;
  accountType?: string;
  digitalSignatureUrl?: string;
  digitalSignatureType?: 'draw' | 'type';
  digitalSignatureName?: string;
  digitalSignatureTitle?: string;
  savedSignedDocuments?: Array<{
    id: string;
    title: string;
    documentType: string;
    signedAt: string;
    signatureDataUrl: string;
    documentContent?: string;
    pdfDataUrl?: string;
  }>;
  businessName?: string;
  ein?: string;
  balance?: number;
  kycLevel?: number;
  interactions?: Array<{
    id: string;
    type: string;
    duration: number;
    notes: string;
    timestamp: string;
    agentEmail: string;
  }>;
  securitySettings?: SecuritySettings;
  protocolStatus?: 'NORMAL' | 'HELD' | 'APPROVED' | 'WARNING' | 'CUSTOM_OVERRIDE';
  protocolInstructionsNote?: string;
  protocolExternalBankName?: string;
  protocolExternalBankBeneficiary?: string;
  protocolExternalBankIban?: string;
  protocolExternalBankSwift?: string;
  protocolExternalBankAmount?: number;
}

// Platform-specific features
export type PlatformTheme = 'blue' | 'green' | 'purple';

export interface PlatformSettings {
  hapticsEnabled: boolean;
  hapticsIntensity?: number;
  biometricsEnabled?: boolean;
  biometricType?: 'FaceID' | 'TouchID' | 'Fingerprint' | 'BiometricPrompt';
  biometricHardwareAvailable?: boolean;
  biometricFallbackToPassword?: boolean;
  biometricRequireForTransactions?: boolean;
  theme: PlatformTheme;
  themeMode?: 'light' | 'dark' | 'system';
  privacyMode?: boolean;
  hftMode?: boolean;
  documentStatementTheme?: 'Modern' | 'Classic' | 'Minimal';
  documentSealColor?: string;
  globalDisabledPaymentMethods?: string[];
  lowBalanceAlertEnabled?: boolean;
  lowBalanceThreshold?: number;
  lowBalanceAccountId?: string;
  beneficiaryEmailTone?: 'Professional' | 'Detailed';
  customPrimaryColor?: string;
}

// Task Management
export enum TaskCategory {
  Financial = 'Financial',
  Personal = 'Personal',
  Work = 'Work',
  Other = 'Other',
}

export type TaskPriority = 'High' | 'Medium' | 'Low';

export type RecurrenceFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'None';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
  dueTime?: string;
  location?: string;
  notificationSent?: boolean;
  category?: TaskCategory;
  priority?: TaskPriority;
  recurrence?: RecurrenceFrequency;
  subtasks?: Subtask[];
  progress?: number; // 0-100
  reason?: string; // AI generated reason
}

// Flight Booking
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: string; // e.g., "8h 30m"
  price: number;
  stops: number;
}

export interface FlightBooking {
    id: string;
    flight: Flight;
    passengers: number;
    totalPrice: number;
    bookingDate: Date;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
}

// Utilities
export enum UtilityType {
    ELECTRICITY = 'Electricity',
    WATER = 'Water',
    GAS = 'Gas',
    INTERNET = 'Internet',
}

export interface UtilityBiller {
    id: string;
    name: string;
    type: UtilityType;
    domain: string;
    accountNumber: string; // user's account number with the biller
    icon?: React.ComponentType<{ className?: string }>;
}

export interface UtilityBill {
    id: string;
    billerId: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
}

// AI Financial Advisor
export interface FinancialInsight {
    category: string; // e.g., "Spending", "Savings"
    insight: string; // e.g., "Your spending on 'Food & Drink' is 20% higher this month."
    priority: 'high' | 'medium' | 'low';
}

export interface ProductRecommendation {
    productType: 'loan' | 'savings_account' | 'insurance' | 'credit_card';
    reason: string; // e.g., "Your high savings balance could be earning more in a High-Yield Savings account."
    suggestedAction: string; // e.g., "Explore Savings Accounts"
    linkTo: View;
}

export interface AdvisorResponse {
    overallSummary: string;
    financialScore: number; // A score from 0-100
    insights: FinancialInsight[];
    recommendations: ProductRecommendation[];
}

export interface AtmLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  network: 'Allpoint' | 'Visa Plus' | 'Cirrus' | 'Premium Reserved Bank';
  lat: number;
  lng: number;
}

// Quickteller / Airtime
export interface AirtimeProvider {
    id: string;
    name: string;
    domain: string;
    logo?: React.ComponentType<{ className?: string }>;
}

export interface AirtimePurchase {
    id: string;
    providerId: string;
    phoneNumber: string;
    amount: number;
    purchaseDate: Date;
}

export interface SavedSession {
  view: View;
  timestamp: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LeadershipProfile {
  name: string;
  title: string;
  imageUrl: string;
  bio: string;
}

// Digital Wallet
export interface WalletDetails {
  balance: number;
  currency: 'USD';
  cardLastFour: string;
}

export interface WalletTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'debit' | 'credit'; // debit is money out, credit is money in
}

// Ratings & Reviews
export interface CustomerReview {
  id: string;
  author: string;
  location: string;
  rating: number; // 1-5
  comment: string;
  date: Date;
}

export interface StaffProfile {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  bio: string;
  rating: number; // 1-5
}

// Global Aid
export interface Cause {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  details?: {
    description: string;
    impacts: string[];
  };
}

export interface Donation {
  id: string;
  causeId: string;
  amount: number;
  date: Date;
}

// NEW: Custom Alerts
export type AlertType =
  | 'BALANCE_BELOW'
  | 'TRANSACTION_ABOVE'
  | 'KEYWORD_MATCH'
  | 'CURRENCY_FLUCTUATION';

export type FxConditionType = 'PERCENT_CHANGE' | 'RATE_ABOVE' | 'RATE_BELOW' | 'VOLATILITY_SPIKE';

export interface Alert {
  id: string;
  type: AlertType;
  accountId: string; // For account-specific alerts
  threshold: number | string; // number for amounts, string for keywords
  notificationMethods: ('push' | 'email' | 'sms')[];
  isActive: boolean;
  // Currency Fluctuation fields
  currencyPair?: string; // e.g. 'USD/EUR', 'USD/GBP', 'USD/JPY'
  fxCondition?: FxConditionType;
  fxTimeframe?: '1h' | '24h' | '7d';
  currentRate?: number;
  lastChangedPercent?: number;
  createdAt?: string;
}

export interface CarRentalOffer {
    id: string;
    vehicleName: string;
    supplierName: string;
    supplierLogo?: string;
    price: number;
    currency: string;
    imageUrl: string;
    seats: number;
    transmission: string;
    baggage: number;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    senderId: string; // 'user' or 'support' or specifically admin email
    senderName: string;
    content: string;
    timestamp: Date;
    read: boolean;
    status?: 'sent' | 'delivered' | 'read' | 'seen' | 'replied' | 'typing';
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
}

export interface ChatSession {
    id: string; // usually user email
    userId: string;
    userName: string;
    startedAt: Date;
    lastUpdatedAt: Date;
    status: 'active' | 'closed' | 'resolved';
    unreadAdminCount: number;
    unreadUserCount: number;
    rating?: number;
    ratingFeedback?: string;
    ratingTimestamp?: string;
}

