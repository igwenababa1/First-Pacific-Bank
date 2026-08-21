import React, { useState, useEffect } from 'react';
import { db, SystemOptions } from '../services/database';
import { 
  Save, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  LayoutTemplate, 
  Globe, 
  CheckCircle2, 
  Eye, 
  History, 
  RotateCcw, 
  Send, 
  X, 
  Smartphone, 
  Monitor, 
  Clock, 
  ArrowLeftRight,
  Code,
  Tag,
  Filter,
  Folder,
  Check,
  Zap,
  Shield,
  Megaphone,
  UserCheck,
  CreditCard,
  Plus,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  AlertTriangle,
  FileEdit,
  ArrowRight,
  Lock,
  CheckSquare,
  FileCheck,
  Building2,
  MapPin,
  FolderPlus,
  Compass
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { BRANDING_CONFIG } from './constants';
import { sendEmail, generateBankingEmailTemplate } from '../services/emailService';

interface TemplateKey {
  id: string;
  name: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
}

const TEMPLATE_KEYS: TemplateKey[] = [

  {
    id: 'certificate_email',
    name: 'Certificate Issuance Email',
    description: 'Triggered when a financial certificate is issued',
    defaultSubject: 'Your Financial Certificate from {{brand_name}}',
    defaultBody: '<p>Your financial certificate is attached.</p>'
  },
  {
    id: 'credit_certificate_email',
    name: 'Credit Certificate Email',
    description: 'Triggered when a credit certificate is issued',
    defaultSubject: 'Your Credit Certificate from {{brand_name}}',
    defaultBody: '<p>Your credit certificate is attached.</p>'
  },
  {
    id: 'external_payment_instructions',
    name: 'External Payment Instructions',
    description: 'Instructions for external payments',
    defaultSubject: 'External Payment Instructions for {{brand_name}}',
    defaultBody: '<p>Please find the payment instructions below.</p>'
  },
  { 
    id: 'welcome_onboarding', 
    name: 'Welcome & Onboarding Sequence', 
    description: 'Triggered when a new user finishes KYC clearance and account activation.',
    defaultSubject: 'Welcome to {{brand_name}} - Executive Account Verified & Active',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px;">Dear {{name}},</p>
  <p style="font-size: 14px; margin-bottom: 20px;">We are pleased to inform you that your institutional clearance and KYC verification with <strong>{{brand_name}}</strong> has been successfully finalized. Your primary multi-currency account is now fully operational.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #059669; font-weight: 800;">Account Clearance Summary</h4>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #64748b;">Account Holder:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{name}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Primary Account Type:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{account_type}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Verification Status:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669;">Tier-1 Fully Cleared</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Activation Date:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
    </table>
  </div>

  <p style="font-size: 14px; margin-bottom: 16px;">With your active account, you enjoy seamless access to global SWIFT/SEPA transfers, real-time portfolio management, and 24/7 dedicated private concierge services.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="{{action_url}}" style="background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">Access Your Private Dashboard</a>
  </div>

  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 12px; color: #166534; margin-top: 24px;">
    <strong>Security Protocol Notice:</strong> {{brand_name}} will never request your password or 2FA security codes via phone or email. Keep your security credentials confidential.
  </div>
</div>`
  },
  { 
    id: 'debit_alert', 
    name: 'Standard Debit / Withdrawal Alert', 
    description: 'Triggered upon successful outbound transfer or debit.',
    defaultSubject: 'Transaction Alert: Outbound Debit of {{amount}} Processed',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">This is an automated notification confirming that an outbound debit transaction has been executed on your <strong>{{account_type}}</strong>.</p>

  <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; font-weight: 800; margin-bottom: 8px;">Debited Amount</div>
    <div style="font-size: 30px; font-weight: 900; color: #be123c; margin-bottom: 16px;">- {{amount}}</div>
    
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; border-top: 1px dashed #fda4af; padding-top: 12px;">
      <tr><td style="padding: 6px 0; color: #881337;">Transaction Reference:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
      <tr><td style="padding: 6px 0; color: #881337;">Execution Date & Time:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #881337;">Payment Network:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">FedWire / Clearing House</td></tr>
    </table>
  </div>

  <p style="font-size: 13px; color: #475569;">If this transfer was initiated by you, no further action is required. Your updated account ledger reflects this ledger entry immediately.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #1e293b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">View Transaction Details</a>
  </div>

  <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px;">Did not authorize this transfer? Please access your security panel or contact our 24/7 fraud prevention team immediately to lock your account.</p>
</div>`
  },
  { 
    id: 'credit_alert', 
    name: 'Standard Credit / Deposit Alert', 
    description: 'Triggered upon successful inbound deposits or credit clearings.',
    defaultSubject: 'Inbound Settlement: Deposit of {{amount}} Credited to Account',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">We are pleased to inform you that an inbound transfer has been successfully cleared and credited to your account ledger.</p>

  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 800; margin-bottom: 8px;">Credited Amount</div>
    <div style="font-size: 32px; font-weight: 900; color: #15803d; margin-bottom: 16px;">+ {{amount}}</div>
    
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; border-top: 1px dashed #86efac; padding-top: 12px;">
      <tr><td style="padding: 6px 0; color: #14532d;">Beneficiary Account:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{account_type}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Settlement Reference:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Clearance Date:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Settlement Status:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #15803d;">Cleared & Available</td></tr>
    </table>
  </div>

  <p style="font-size: 13px; color: #475569;">These funds are immediately available for withdrawal, reinvestment, or international transfer.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Manage Available Funds</a>
  </div>
</div>`
  },
  { 
    id: 'wire_pending_clearance', 
    name: 'High-Value Wire Pending Approval', 
    description: 'Triggered when wire transfers require compliance or clearance codes.',
    defaultSubject: 'Compliance Notice: Outbound Wire {{reference}} Pending Verification',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">Your outbound wire transfer request for <strong>{{amount}}</strong> is currently being reviewed under international financial compliance regulations and standard institutional verification safeguards.</p>

  <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b45309; font-weight: 800; margin-bottom: 8px;">Pending Settlement Details</div>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #78350f;">Requested Amount:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{amount}}</td></tr>
      <tr><td style="padding: 6px 0; color: #78350f;">Wire Control Number:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
      <tr><td style="padding: 6px 0; color: #78350f;">Submission Time:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #78350f;">Current Status:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #d97706;">Awaiting Compliance Release</td></tr>
    </table>
  </div>

  <p style="font-size: 13px; color: #475569;">To accelerate the release of your funds, please verify your security credentials or complete any pending authorization codes in your client portal.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #d97706; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Review & Authorize Transfer</a>
  </div>
</div>`
  },
  { 
    id: 'loan_approval', 
    name: 'Credit Facility / Loan Approved', 
    description: 'Triggered when credit limits or overdraft applications are granted.',
    defaultSubject: 'Congratulations {{name}}: Your {{amount}} Credit Line is Approved',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">We are pleased to inform you that your application for a private credit facility with <strong>{{brand_name}}</strong> has been formally approved by our underwriting committee.</p>

  <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 800; margin-bottom: 8px;">Approved Credit Limit</div>
    <div style="font-size: 32px; font-weight: 900; color: #15803d; margin-bottom: 16px;">{{amount}}</div>
    
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; border-top: 1px dashed #86efac; padding-top: 12px;">
      <tr><td style="padding: 6px 0; color: #14532d;">Facility Ref Code:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Approval Date:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Disbursement Status:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #15803d;">Ready for Instant Release</td></tr>
    </table>
  </div>

  <p style="font-size: 13px; color: #475569;">You can disburse these funds directly into your checking account or multi-currency vault at any time.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Accept & Disburse Funds</a>
  </div>
</div>`
  },
  { 
    id: 'security_login', 
    name: 'New Device / Suspicious Login', 
    description: 'Triggered when login telemetry detects anomalous devices or locations.',
    defaultSubject: 'Security Alert: New Sign-in Detected for {{name}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">Our security monitoring system recorded a sign-in event to your account from a new device or unrecognized IP location.</p>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #475569; font-weight: 800; margin-bottom: 8px;">Telemetry Metadata</div>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #64748b;">Timestamp:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Target Account:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{email}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Session ID:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
    </table>
  </div>

  <p style="font-size: 13px; color: #475569;">If this was you, no further action is necessary. If you did not perform this login, your account security may be compromised.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #ef4444; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">Lock Credentials & Reset Password</a>
  </div>
</div>`
  },
  { 
    id: 'otp_verification', 
    name: 'Secure OTP Verification Code', 
    description: '2FA authentication challenge and passcode dispatch.',
    defaultSubject: '{{otp_code}} is your Security Verification Code',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Hello {{name}},</p>
  <p style="font-size: 14px;">Your high-security one-time authentication code for <strong>{{brand_name}}</strong> is requested below:</p>

  <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #047857; font-weight: 800; display: block; margin-bottom: 8px;">Dynamic Security Clearance Passcode</span>
    <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #059669; font-family: monospace;">{{otp_code}}</div>
    <span style="font-size: 11px; color: #065f46; margin-top: 8px; display: block;">Valid for the next 10 minutes</span>
  </div>

  <p style="font-size: 12px; color: #64748b; text-align: center;">Never disclose this code to anyone, including bank representatives. Our officers will never ask for your passcode.</p>
</div>`
  },
  { 
    id: 'statement_ready', 
    name: 'Monthly Portfolio & Account Statement', 
    description: 'Triggered monthly when new transaction ledgers and PDFs are generated.',
    defaultSubject: 'Account Statement Available: {{date}} - {{brand_name}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">Your official monthly account statement and portfolio ledger summary for <strong>{{date}}</strong> is now finalized and ready for review.</p>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #334155; font-weight: 800; margin-bottom: 12px;">Statement Executive Highlights</div>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #64748b;">Account Type:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{account_type}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Closing Portfolio Value:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669;">{{amount}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Statement Document Ref:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
    </table>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #0f172a; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Download Official PDF Statement</a>
  </div>
</div>`
  },
  { 
    id: 'card_status_update', 
    name: 'Card Security & PIN Status Update', 
    description: 'Triggered when physical or virtual debit card PINs are updated or frozen.',
    defaultSubject: 'Debit / Credit Card Security Notice for {{name}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">This message confirms a status update regarding your payment card associated with account <strong>{{account_type}}</strong>.</p>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #64748b;">Card Product:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">Platinum World Debit</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Action Event:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0284c7;">PIN / Security Lock Change</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Timestamp:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Control Ref:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
    </table>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background-color: #0284c7; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Manage Card Settings</a>
  </div>
</div>`
  },
  { 
    id: 'dividend_interest_credit', 
    name: 'Annual Interest & Yield Credit', 
    description: 'Triggered when high-yield interest or dividends are credited.',
    defaultSubject: 'Yield Payout: {{amount}} Dividend Interest Credited',
    defaultBody: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px; font-weight: bold; color: #0f172a;">Dear {{name}},</p>
  <p style="font-size: 14px;">We are delighted to announce that your annual account interest yield and performance dividend has been calculated and disbursed directly to your account.</p>

  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: 800; margin-bottom: 8px;">Total Interest Yield Paid</div>
    <div style="font-size: 32px; font-weight: 900; color: #166534; margin-bottom: 16px;">+ {{amount}}</div>
    
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; border-top: 1px dashed #86efac; padding-top: 12px;">
      <tr><td style="padding: 6px 0; color: #14532d;">Beneficiary Vault:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{account_type}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Effective Date:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      <tr><td style="padding: 6px 0; color: #14532d;">Disbursement Ref:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-family: monospace;">{{reference}}</td></tr>
    </table>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="{{action_url}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">View Yield Performance</a>
  </div>
</div>`
  },
  {
    id: 'monthly_statement',
    name: 'Monthly Account Statement',
    description: 'Triggered when monthly portfolio & transaction statement is generated',
    defaultSubject: 'Your {{brand_name}} Monthly Statement is Available',
    defaultBody: `<p>Dear {{name}},</p><p>Your monthly statement for {{account_type}} is ready for download in your online banking portal.</p>`
  },
  {
    id: 'wire_transfer_confirmation',
    name: 'Wire Transfer Execution Confirmation',
    description: 'Triggered when an international or domestic wire transfer is executed',
    defaultSubject: 'Wire Transfer Confirmation: {{amount}} Sent (Ref: {{reference}})',
    defaultBody: `<p>Dear {{name}},</p><p>Your wire transfer of {{amount}} has been executed successfully. Reference ID: {{reference}}.</p>`
  },
  {
    id: 'security_2fa',
    name: 'Two-Factor Security Code',
    description: 'Triggered during login or step-up authentication',
    defaultSubject: '{{code}} is your {{brand_name}} Security Passcode',
    defaultBody: `<p>Your single-use security code is: <strong>{{code}}</strong>. Valid for 10 minutes.</p>`
  },
  {
    id: 'password_reset',
    name: 'Password Reset Request',
    description: 'Triggered when a user requests to reset their password',
    defaultSubject: 'Reset Your {{brand_name}} Password',
    defaultBody: `<p>Dear {{name}},</p><p>Click the link below to securely reset your account password:</p><p><a href="{{action_url}}">Reset Password</a></p>`
  },
  {
    id: 'card_shipment',
    name: 'Debit / Credit Card Dispatch & Tracking',
    description: 'Triggered when a physical payment card is dispatched',
    defaultSubject: 'Your {{brand_name}} Premium Card Has Been Dispatched',
    defaultBody: `<p>Dear {{name}},</p><p>Your physical card for {{account_type}} has been shipped and is on its way.</p>`
  },
  {
    id: 'kyc_verification',
    name: 'KYC & Verification Status Update',
    description: 'Triggered when identity verification status updates',
    defaultSubject: 'KYC Verification Status Update - {{brand_name}}',
    defaultBody: `<p>Dear {{name}},</p><p>Your identity verification and compliance clearance status is verified and active.</p>`
  },
  {
    id: 'marketing_promo',
    name: 'Exclusive Member Offer / Yield Update',
    description: 'Promotional updates and high-yield announcements',
    defaultSubject: 'Exclusive Opportunity: Multi-Currency Yield Tier Enabled',
    defaultBody: `<p>Dear {{name}},</p><p>Discover our new high-yield investment options tailored for your account.</p>`
  },
  {
    id: 'account_frozen',
    name: 'Security Lock & Hold Advisory',
    description: 'Triggered when an account freeze or security hold is requested',
    defaultSubject: 'Security Alert: Temporary Lock Applied to Account',
    defaultBody: `<p>Dear {{name}},</p><p>A security hold was placed on your account per request. Contact support to manage security protocols.</p>`
  },
];

const DEFAULT_CATEGORIES: Record<string, { category: string; tags: string[]; confidence: number; rationale: string }> = {
  welcome_onboarding: {
    category: 'Onboarding',
    tags: ['Welcome Sequence', 'KYC Clearance', 'Account Activation'],
    confidence: 0.98,
    rationale: 'Guides newly verified customers through Tier-1 account activation and portal access.'
  },
  debit_alert: {
    category: 'Transactions',
    tags: ['Outbound Debit', 'Transaction Alert', 'Funds Out'],
    confidence: 0.97,
    rationale: 'Notifies customer of executed debit entries and ledger balance changes.'
  },
  credit_alert: {
    category: 'Transactions',
    tags: ['Inbound Deposit', 'Settlement', 'Funds In'],
    confidence: 0.99,
    rationale: 'Confirms cleared inbound transfers and immediate fund availability.'
  },
  wire_pending_clearance: {
    category: 'Compliance',
    tags: ['AML Verification', 'Wire Control', 'Pending Release'],
    confidence: 0.96,
    rationale: 'Requires compliance clearance and release codes for high-value transfers.'
  },
  loan_approval: {
    category: 'Credit & Yield',
    tags: ['Credit Line', 'Underwriting', 'Disbursement'],
    confidence: 0.98,
    rationale: 'Informs client of credit facility approval and fund disbursement options.'
  },
  security_login: {
    category: 'Security',
    tags: ['Security Alert', 'New Device', 'Telemetry'],
    confidence: 0.99,
    rationale: 'Alerts account holder to unrecognized sign-in telemetry and location data.'
  },
  otp_verification: {
    category: 'Security',
    tags: ['2FA Code', 'Authentication', 'Passcode'],
    confidence: 0.99,
    rationale: 'Dispatches dynamic single-use authentication codes for login clearance.'
  },
  statement_ready: {
    category: 'Account Activity',
    tags: ['Monthly Ledger', 'PDF Statement', 'Portfolio Summary'],
    confidence: 0.97,
    rationale: 'Delivers official monthly portfolio ledgers and account statements.'
  },
  card_status_update: {
    category: 'Security',
    tags: ['PIN Security', 'Debit Card', 'Card Lock'],
    confidence: 0.95,
    rationale: 'Confirms security updates to payment cards, PINs, or card freeze states.'
  },
  dividend_interest_credit: {
    category: 'Credit & Yield',
    tags: ['Yield Payout', 'Dividends', 'Annual Interest'],
    confidence: 0.98,
    rationale: 'Notifies holder of annual dividend yield payout credited to their account.'
  },
  certificate_email: {
    category: 'Compliance',
    tags: ['Certificate', 'Financial Audit', 'Official Document'],
    confidence: 0.98,
    rationale: 'Delivers official banking certificate of balance or holdings.'
  },
  credit_certificate_email: {
    category: 'Credit & Yield',
    tags: ['Credit Certificate', 'Facility', 'Lending'],
    confidence: 0.98,
    rationale: 'Delivers official credit facility certificate.'
  },
  external_payment_instructions: {
    category: 'Transactions',
    tags: ['Wire Instructions', 'Payment Routing', 'External Transfer'],
    confidence: 0.98,
    rationale: 'Provides routing instructions for inbound external payments.'
  },
  monthly_statement: {
    category: 'Account Activity',
    tags: ['Monthly Ledger', 'PDF Statement', 'Portfolio Summary'],
    confidence: 0.98,
    rationale: 'Delivers official monthly portfolio statements.'
  },
  wire_transfer_confirmation: {
    category: 'Transactions',
    tags: ['Wire Execution', 'SWIFT', 'Settlement'],
    confidence: 0.99,
    rationale: 'Confirms international or domestic wire execution.'
  },
  security_2fa: {
    category: 'Security',
    tags: ['2FA Code', 'Passcode', 'Step-up Auth'],
    confidence: 0.99,
    rationale: 'Dispatches dynamic 2FA passcodes.'
  },
  password_reset: {
    category: 'Security',
    tags: ['Password Reset', 'Credentials', 'Account Security'],
    confidence: 0.99,
    rationale: 'Delivers secure password reset authorization links.'
  },
  card_shipment: {
    category: 'Transactions',
    tags: ['Card Operations', 'Physical Card', 'Dispatch'],
    confidence: 0.97,
    rationale: 'Notifies holder of physical debit/credit card dispatch.'
  },
  kyc_verification: {
    category: 'Compliance',
    tags: ['KYC Clearance', 'Identity Verified', 'Tier-1'],
    confidence: 0.99,
    rationale: 'Confirms KYC compliance status updates.'
  },
  marketing_promo: {
    category: 'Promotional',
    tags: ['Member Offer', 'Yield Tier', 'Promotional'],
    confidence: 0.95,
    rationale: 'Announces exclusive high-yield opportunities.'
  },
  account_frozen: {
    category: 'Security',
    tags: ['Security Hold', 'Emergency Freeze', 'Account Lock'],
    confidence: 0.99,
    rationale: 'Notifies account holder of security hold placement.'
  }
};

const CATEGORY_OPTIONS = ['All', 'Security', 'Promotional', 'Account Activity', 'Onboarding', 'Transactions', 'Credit & Yield', 'Compliance'];

export interface FolderItem {
  id: string;
  name: string;
  type: 'Department' | 'Region' | 'General';
  description?: string;
  color?: string;
}

export const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'dept_retail', name: 'Retail & Consumer Banking', type: 'Department', description: 'Onboarding, deposit alerts, consumer accounts', color: 'emerald' },
  { id: 'dept_wealth', name: 'Wealth & Private Banking', type: 'Department', description: 'High-net-worth statements & private banking', color: 'amber' },
  { id: 'dept_compliance', name: 'Legal, Compliance & Security', type: 'Department', description: 'KYC clearance, 2FA, security alerts', color: 'rose' },
  { id: 'dept_loans', name: 'Commercial & Mortgage Lending', type: 'Department', description: 'Loan approvals, interest updates, escrow', color: 'cyan' },
  { id: 'dept_card', name: 'Card Operations & Fraud Prevention', type: 'Department', description: 'Card dispatches, hold notifications, dispute updates', color: 'purple' },
  { id: 'reg_na', name: 'North America (OCC / FINRA / CFPB)', type: 'Region', description: 'US & Canadian regulatory compliance templates', color: 'blue' },
  { id: 'reg_eu', name: 'European Union (GDPR / EBA / PSD2)', type: 'Region', description: 'EU GDPR & PSD2 compliant transactional templates', color: 'indigo' },
  { id: 'reg_uk', name: 'United Kingdom (FCA / PRA / Consumer Duty)', type: 'Region', description: 'FCA ring-fenced & UK Consumer Duty disclosures', color: 'violet' },
  { id: 'reg_apac', name: 'Asia-Pacific (MAS / HKMA)', type: 'Region', description: 'Singapore MAS & Hong Kong HKMA compliance templates', color: 'teal' },
  { id: 'reg_global', name: 'Global Cross-Border Standard', type: 'Region', description: 'Multi-jurisdictional baseline notifications', color: 'slate' }
];

export const DEFAULT_FOLDER_MAPPINGS: Record<string, string> = {
  welcome_onboarding: 'dept_retail',
  debit_alert: 'dept_retail',
  credit_alert: 'dept_retail',
  monthly_statement: 'dept_wealth',
  wire_transfer_confirmation: 'reg_global',
  security_2fa: 'dept_compliance',
  password_reset: 'dept_compliance',
  loan_approval: 'dept_loans',
  card_shipment: 'dept_card',
  kyc_verification: 'dept_compliance',
  marketing_promo: 'dept_retail',
  account_frozen: 'dept_compliance'
};

const DUMMY_PREVIEW_DATA: Record<string, string> = {
  name: 'Alexander Vance',
  email: 'a.vance@pacific-capital.com',
  amount: '$25,480.00',
  date: 'July 22, 2026',
  reference: 'TXN-99821-PAC-US',
  action_url: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app/dashboard',
  brand_name: 'First Pacific Bank & Trust',
  otp_code: '849201',
  account_type: 'Executive Wealth Reserve ****9281'
};

import { AdminEmailTemplatePreviewerModal } from './AdminEmailTemplatePreviewerModal';
import { UserRecord } from '../services/database';

interface AdminGlobalEmailTemplatesHubProps {
  allUsers?: UserRecord[];
}

export const AdminGlobalEmailTemplatesHub: React.FC<AdminGlobalEmailTemplatesHubProps> = ({ allUsers = [] }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome_onboarding');
  const [systemOptions, setSystemOptions] = useState<SystemOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Full Previewer & Bulk Send State
  const [isFullPreviewerOpen, setIsFullPreviewerOpen] = useState(false);

  // Preview state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Test Email state
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('info@lawrenceconsultantsorg.org');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  // Version History state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [revertConfirmVersion, setRevertConfirmVersion] = useState<any | null>(null);

  // AI Categorization State
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeCategoryResult, setActiveCategoryResult] = useState<{
    category: string;
    tags: string[];
    confidence: number;
    rationale: string;
    suggestedFolder?: string;
    recommendedAction?: string;
  } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isBatchCategorizing, setIsBatchCategorizing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string>('');

  // Status & Approval Workflow State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [isRequestApprovalModalOpen, setIsRequestApprovalModalOpen] = useState(false);
  const [approvalRequestNotes, setApprovalRequestNotes] = useState('');
  const [qcChecks, setQcChecks] = useState({
    subjectVerified: true,
    layoutTested: true,
    complianceApproved: true
  });

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalReviewerNotes, setApprovalReviewerNotes] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [isGateBlockedModalOpen, setIsGateBlockedModalOpen] = useState(false);
  const [gateBlockedMessage, setGateBlockedMessage] = useState('');

  // Folder Organizational Structure State
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('All');
  const [selectedFolderTypeView, setSelectedFolderTypeView] = useState<'All' | 'Department' | 'Region'>('All');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'Department' | 'Region' | 'General'>('Department');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');

  const getAllFolders = (): FolderItem[] => {
    const customFolders = systemOptions?.emailTemplateFolders?.customFolders || [];
    return [...DEFAULT_FOLDERS, ...customFolders];
  };

  const getTemplateFolderId = (tid: string): string => {
    const saved = systemOptions?.emailTemplateFolders?.mappings?.[tid];
    if (saved) return saved;
    return DEFAULT_FOLDER_MAPPINGS[tid] || 'dept_retail';
  };

  const getFolderById = (folderId: string): FolderItem => {
    const all = getAllFolders();
    return all.find(f => f.id === folderId) || { id: folderId, name: 'General Folder', type: 'General', color: 'slate' };
  };

  const handleAssignFolderToTemplate = async (tid: string, folderId: string) => {
    if (!systemOptions) return;
    const currentMappings = systemOptions.emailTemplateFolders?.mappings || {};
    const updatedMappings = {
      ...currentMappings,
      [tid]: folderId
    };
    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateFolders: {
        ...(systemOptions.emailTemplateFolders || {}),
        mappings: updatedMappings
      }
    };
    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    const folderObj = getFolderById(folderId);
    setSaveSuccess(`Template assigned to ${folderObj.type} folder '${folderObj.name}'`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleCreateFolderSubmit = async () => {
    if (!systemOptions || !newFolderName.trim()) return;
    const newFolderObj: FolderItem = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      type: newFolderType,
      description: newFolderDescription.trim() || undefined,
      color: newFolderColor
    };
    const currentCustom = systemOptions.emailTemplateFolders?.customFolders || [];
    const updatedCustom = [...currentCustom, newFolderObj];
    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateFolders: {
        ...(systemOptions.emailTemplateFolders || {}),
        customFolders: updatedCustom
      }
    };
    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setIsCreateFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderDescription('');
    setSaveSuccess(`New ${newFolderType} organizational folder '${newFolderObj.name}' created!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const STATUS_FILTER_OPTIONS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Global / Live'];

  const getTemplateStatusData = (tid: string) => {
    const statusObj = systemOptions?.emailTemplateStatuses?.[tid];
    if (statusObj) {
      return statusObj;
    }
    return {
      status: 'Draft' as const,
      requestedBy: undefined,
      requestedAt: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      notes: 'Initial template draft',
      rejectionReason: undefined
    };
  };

  const getStatusBadgeStyle = (status: 'Draft' | 'Pending Approval' | 'Approved' | 'Global / Live') => {
    switch (status) {
      case 'Draft':
        return {
          bg: 'bg-amber-500 text-amber-700 dark:text-amber-400 border-amber-500/30',
          label: 'Draft',
          icon: FileEdit
        };
      case 'Pending Approval':
        return {
          bg: 'bg-orange-500 text-orange-700 dark:text-orange-300 border-orange-500/40 animate-pulse',
          label: 'Pending Approval',
          icon: Clock
        };
      case 'Approved':
        return {
          bg: 'bg-emerald-500 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          label: 'Approved',
          icon: ShieldCheck
        };
      case 'Global / Live':
        return {
          bg: 'bg-cyan-500 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm',
          label: 'Global / Ready for Deployment',
          icon: Globe
        };
      default:
        return {
          bg: 'bg-slate-500 text-[#0F172A] dark:text-white border-slate-500/30',
          label: 'Draft',
          icon: FileEdit
        };
    }
  };

  const handleOpenRequestApproval = () => {
    setApprovalRequestNotes('');
    setQcChecks({
      subjectVerified: true,
      layoutTested: true,
      complianceApproved: true
    });
    setIsRequestApprovalModalOpen(true);
  };

  const handleSubmitRequestApproval = async () => {
    if (!systemOptions) return;
    if (!qcChecks.subjectVerified || !qcChecks.layoutTested || !qcChecks.complianceApproved) {
      alert("Please confirm all Quality Control checks before submitting for approval.");
      return;
    }

    const updatedStatuses = {
      ...(systemOptions.emailTemplateStatuses || {}),
      [selectedTemplate]: {
        status: 'Pending Approval' as const,
        requestedBy: 'Administrator',
        requestedAt: new Date().toISOString(),
        notes: approvalRequestNotes.trim() || 'Submitted for Quality Control & Compliance Review.'
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateStatuses: updatedStatuses
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setIsRequestApprovalModalOpen(false);
    setSaveSuccess(`Approval request submitted for '${activeTemplateObj?.name}'! Status updated to 'Pending Approval'.`);
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  const handleApproveTemplateSubmit = async () => {
    if (!systemOptions) return;

    const currentData = getTemplateStatusData(selectedTemplate);
    const updatedStatuses = {
      ...(systemOptions.emailTemplateStatuses || {}),
      [selectedTemplate]: {
        ...currentData,
        status: 'Approved' as const,
        approvedBy: 'Compliance Admin',
        approvedAt: new Date().toISOString(),
        notes: approvalReviewerNotes.trim() || 'Quality control standards verified and approved for global release.'
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateStatuses: updatedStatuses
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setIsApproveModalOpen(false);
    setSaveSuccess(`Template '${activeTemplateObj?.name}' Approved! Unlocked for Global / Live deployment.`);
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  const handleRejectTemplateSubmit = async () => {
    if (!systemOptions) return;

    const updatedStatuses = {
      ...(systemOptions.emailTemplateStatuses || {}),
      [selectedTemplate]: {
        status: 'Draft' as const,
        notes: 'Returned to Draft during quality control review',
        rejectionReason: rejectionReasonInput.trim() || 'Quality control revision requested by reviewer.'
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateStatuses: updatedStatuses
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setIsRejectModalOpen(false);
    setSaveSuccess(`Template returned to 'Draft' status for required revisions.`);
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  const handlePublishGlobal = async () => {
    if (!systemOptions) return;
    const currentStatusData = getTemplateStatusData(selectedTemplate);

    // Gate Enforcement: Cannot mark as Global if Draft or Pending Approval!
    if (currentStatusData.status === 'Draft' || currentStatusData.status === 'Pending Approval') {
      setGateBlockedMessage(
        `Quality Control Protection Gate: Template '${activeTemplateObj?.name}' is currently in '${currentStatusData.status}' status. An administrator must click 'Request Approval' and obtain approval before this template can be marked as 'Global' or 'Ready for Deployment'.`
      );
      setIsGateBlockedModalOpen(true);
      return;
    }

    const updatedStatuses = {
      ...(systemOptions.emailTemplateStatuses || {}),
      [selectedTemplate]: {
        ...currentStatusData,
        status: 'Global / Live' as const,
        notes: 'Published as Global / Ready for Deployment'
      }
    };

    const updatedOverrides = {
      ...(systemOptions.emailOverrides || {}),
      [selectedTemplate]: {
        subject,
        body,
        enabled: isEnabled
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailOverrides: updatedOverrides,
      emailTemplateStatuses: updatedStatuses
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setSaveSuccess(`Template '${activeTemplateObj?.name}' successfully marked as Global / Ready for Deployment!`);
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  const handleRevertToDraft = async () => {
    if (!systemOptions) return;

    const updatedStatuses = {
      ...(systemOptions.emailTemplateStatuses || {}),
      [selectedTemplate]: {
        status: 'Draft' as const,
        notes: 'Reset to Draft status for updates.'
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateStatuses: updatedStatuses
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setSaveSuccess(`Template status reset to 'Draft'. Re-approval required before live deployment.`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const opts = await db.getSystemOptions();
      setSystemOptions(opts);

      const templateConfig = TEMPLATE_KEYS.find(t => t.id === 'welcome_onboarding');
      if (opts.emailOverrides && opts.emailOverrides['welcome_onboarding']) {
        setSubject(opts.emailOverrides['welcome_onboarding'].subject);
        setBody(opts.emailOverrides['welcome_onboarding'].body);
        setIsEnabled(opts.emailOverrides['welcome_onboarding'].enabled);
      } else if (templateConfig) {
        setSubject(templateConfig.defaultSubject);
        setBody(templateConfig.defaultBody);
        setIsEnabled(true);
      }
    } catch (error) {
      console.error("Failed to load global templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (tid: string) => {
    setSelectedTemplate(tid);
    const templateConfig = TEMPLATE_KEYS.find(t => t.id === tid);
    if (systemOptions?.emailOverrides && systemOptions.emailOverrides[tid]) {
      setSubject(systemOptions.emailOverrides[tid].subject);
      setBody(systemOptions.emailOverrides[tid].body);
      setIsEnabled(systemOptions.emailOverrides[tid].enabled);
    } else if (templateConfig) {
      setSubject(templateConfig.defaultSubject);
      setBody(templateConfig.defaultBody);
      setIsEnabled(true);
    }
  };

  const getTemplateCategoryData = (tid: string) => {
    const customCat = systemOptions?.emailTemplateCategories?.[tid];
    if (customCat) {
      return {
        category: customCat.category || 'Account Activity',
        tags: customCat.tags || [],
        confidence: customCat.confidence || 0.95,
        rationale: customCat.rationale || '',
        isCustom: true
      };
    }
    const defaultCat = DEFAULT_CATEGORIES[tid] || {
      category: 'Account Activity',
      tags: ['Transactional', 'System Notice'],
      confidence: 0.9,
      rationale: 'Standard notification template.'
    };
    return { ...defaultCat, isCustom: false };
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Security':
        return 'bg-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Promotional':
        return 'bg-purple-500 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Account Activity':
        return 'bg-sky-500 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'Onboarding':
        return 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Transactions':
        return 'bg-green-500 text-green-600 dark:text-green-400 border-green-500/30';
      case 'Credit & Yield':
        return 'bg-amber-500 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Compliance':
        return 'bg-cyan-500 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500 text-[#0F172A] dark:text-white border-slate-500/30';
    }
  };

  const handleAICategorizeTemplate = async (templateId?: string) => {
    const targetId = templateId || selectedTemplate;
    const targetObj = TEMPLATE_KEYS.find(t => t.id === targetId);
    if (!targetObj) return;

    const currentSub = targetId === selectedTemplate ? subject : targetObj.defaultSubject;
    const currentBody = targetId === selectedTemplate ? body : targetObj.defaultBody;

    setIsCategorizing(true);
    try {
      const res = await fetch('/api/admin/categorize-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          name: targetObj.name,
          subject: currentSub,
          body: currentBody,
          description: targetObj.description
        })
      });

      if (!res.ok) throw new Error('Failed to fetch AI categorization');
      const data = await res.json();

      setActiveCategoryResult({
        category: data.category || 'Account Activity',
        tags: data.tags || ['System Notice'],
        confidence: data.confidence || 0.95,
        rationale: data.rationale || 'Categorized based on AI content structure analysis.',
        suggestedFolder: data.suggestedFolder || 'General Comms',
        recommendedAction: data.recommendedAction || 'Review tags and apply to template configuration.'
      });
      setIsCategoryModalOpen(true);
    } catch (err) {
      console.error('Categorization error:', err);
      // Fallback
      const fallbackCat = getTemplateCategoryData(targetId);
      setActiveCategoryResult({
        category: fallbackCat.category,
        tags: fallbackCat.tags,
        confidence: fallbackCat.confidence,
        rationale: fallbackCat.rationale,
        suggestedFolder: `${fallbackCat.category} Folders`,
        recommendedAction: 'Apply tags to maintain organized admin template repository.'
      });
      setIsCategoryModalOpen(true);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleApplyCategorization = async () => {
    if (!activeCategoryResult || !systemOptions) return;

    const updatedCategories = {
      ...(systemOptions.emailTemplateCategories || {}),
      [selectedTemplate]: {
        category: activeCategoryResult.category,
        tags: activeCategoryResult.tags,
        confidence: activeCategoryResult.confidence,
        rationale: activeCategoryResult.rationale,
        updatedAt: new Date().toISOString()
      }
    };

    const updatedOpts: SystemOptions = {
      ...systemOptions,
      emailTemplateCategories: updatedCategories
    };

    await db.saveSystemOptions(updatedOpts);
    setSystemOptions(updatedOpts);
    setIsCategoryModalOpen(false);
    setSaveSuccess(`AI Category '${activeCategoryResult.category}' and tags applied & saved!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim() || !activeCategoryResult) return;
    const newTag = customTagInput.trim();
    if (!activeCategoryResult.tags.includes(newTag)) {
      setActiveCategoryResult({
        ...activeCategoryResult,
        tags: [...activeCategoryResult.tags, newTag]
      });
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeCategoryResult) return;
    setActiveCategoryResult({
      ...activeCategoryResult,
      tags: activeCategoryResult.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleBatchCategorizeAll = async () => {
    if (!systemOptions) return;
    setIsBatchCategorizing(true);
    setBatchProgress('Analyzing template collection with Gemini...');
    
    try {
      const newCategories: Record<string, any> = { ...(systemOptions.emailTemplateCategories || {}) };
      for (let i = 0; i < TEMPLATE_KEYS.length; i++) {
        const t = TEMPLATE_KEYS[i];
        setBatchProgress(`Categorizing ${i + 1}/${TEMPLATE_KEYS.length}: ${t.name}...`);
        
        const override = systemOptions.emailOverrides?.[t.id];
        const curSub = override?.subject || t.defaultSubject;
        const curBody = override?.body || t.defaultBody;

        const res = await fetch('/api/admin/categorize-email-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: t.id,
            name: t.name,
            subject: curSub,
            body: curBody,
            description: t.description
          })
        });

        if (res.ok) {
          const data = await res.json();
          newCategories[t.id] = {
            category: data.category || 'Account Activity',
            tags: data.tags || ['System Notice'],
            confidence: data.confidence || 0.95,
            rationale: data.rationale || 'Batch categorized by AI',
            updatedAt: new Date().toISOString()
          };
        }
      }

      const updatedOpts: SystemOptions = {
        ...systemOptions,
        emailTemplateCategories: newCategories
      };

      await db.saveSystemOptions(updatedOpts);
      setSystemOptions(updatedOpts);
      setSaveSuccess(`All ${TEMPLATE_KEYS.length} email templates categorized successfully with AI!`);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      console.error('Batch categorization failed:', err);
    } finally {
      setIsBatchCategorizing(false);
      setBatchProgress('');
    }
  };

  const handleSave = async () => {
    if (!systemOptions) return;
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const existingVersions = systemOptions.emailTemplateVersions?.[selectedTemplate] || [];
      const newVersionNum = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

      const newVersionRecord = {
        version: newVersionNum,
        timestamp: new Date().toISOString(),
        author: 'Admin Console',
        subject,
        body,
        enabled: isEnabled
      };

      const updatedVersions = {
        ...(systemOptions.emailTemplateVersions || {}),
        [selectedTemplate]: [newVersionRecord, ...existingVersions]
      };

      const updatedOverrides = {
        ...(systemOptions.emailOverrides || {}),
        [selectedTemplate]: {
          subject,
          body,
          enabled: isEnabled
        }
      };

      const updatedOpts: SystemOptions = { 
        ...systemOptions, 
        emailOverrides: updatedOverrides,
        emailTemplateVersions: updatedVersions
      };

      await db.saveSystemOptions(updatedOpts);
      setSystemOptions(updatedOpts);
      setSaveSuccess(`Template v${newVersionNum} saved globally and added to history.`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevertVersion = async (versionRecord: any) => {
    setSubject(versionRecord.subject);
    setBody(versionRecord.body);
    setIsEnabled(versionRecord.enabled);
    setRevertConfirmVersion(null);
    setSaveSuccess(`Restored template version v${versionRecord.version} into editor! Click 'Save' to publish.`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const renderInterpolatedHTML = (subjectText: string, bodyText: string) => {
    let resultSubject = subjectText;
    let resultBody = bodyText;

    Object.entries(DUMMY_PREVIEW_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      resultSubject = resultSubject.replace(regex, value);
      resultBody = resultBody.replace(regex, value);
    });

    const fullTemplate = generateBankingEmailTemplate(resultSubject, resultBody, 'Access Portal', DUMMY_PREVIEW_DATA.action_url);
    return { subject: resultSubject, html: fullTemplate };
  };

  const handleSendTestEmail = async () => {
    if (!testRecipientEmail) return;
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const { subject: renderedSub, html: renderedBody } = renderInterpolatedHTML(subject, body);
      await sendEmail(testRecipientEmail, `[TEST PREVIEW] ${renderedSub}`, renderedBody);
      setTestEmailStatus('Test email successfully dispatched to ' + testRecipientEmail);
    } catch (e: any) {
      setTestEmailStatus('Failed to send test email: ' + (e.message || 'Error'));
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const activeTemplateObj = TEMPLATE_KEYS.find(t => t.id === selectedTemplate);
  const currentVersions = systemOptions?.emailTemplateVersions?.[selectedTemplate] || [];
  const currentCategoryData = getTemplateCategoryData(selectedTemplate);
  const currentStatusData = getTemplateStatusData(selectedTemplate);
  const currentStatusBadge = getStatusBadgeStyle(currentStatusData.status);
  const currentFolderId = getTemplateFolderId(selectedTemplate);
  const currentFolderObj = getFolderById(currentFolderId);

  const filteredTemplates = TEMPLATE_KEYS.filter(t => {
    const catData = getTemplateCategoryData(t.id);
    const statusData = getTemplateStatusData(t.id);
    const tFolderId = getTemplateFolderId(t.id);
    const tFolderObj = getFolderById(tFolderId);

    const matchesCategory = selectedCategoryFilter === 'All' || catData.category === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === 'All' || statusData.status === selectedStatusFilter;
    
    let matchesFolderType = true;
    if (selectedFolderTypeView !== 'All') {
      matchesFolderType = tFolderObj.type === selectedFolderTypeView;
    }

    let matchesFolder = true;
    if (selectedFolderFilter !== 'All') {
      matchesFolder = tFolderId === selectedFolderFilter;
    }

    const matchesSearch = !templateSearchQuery.trim() ||
      t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      t.defaultSubject.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(templateSearchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesFolderType && matchesFolder && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-[#0F172A] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Email Templates Hub...</p>
      </div>
    );
  }

  const previewRender = renderInterpolatedHTML(subject, body);

  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 font-mono">
              Global Email Templates Hub
            </h2>
          </div>
          <p className="text-[#0F172A] dark:text-white text-sm max-w-3xl">
            Design, test, AI-categorize, version-control, and deploy custom transactional HTML email templates for platform notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced Categorize AI Button */}
          <button
            onClick={() => handleAICategorizeTemplate(selectedTemplate)}
            disabled={isCategorizing}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-70"
          >
            {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />}
            <span>Categorize with AI</span>
          </button>

          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              showVersionHistory 
                ? 'bg-amber-500 text-amber-400 border-amber-500/30' 
                : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white'
            }`}
          >
            <History className="w-4 h-4 text-amber-500" />
            <span>History ({currentVersions.length})</span>
          </button>

          <button
            onClick={() => setIsFullPreviewerOpen(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-emerald-500" />
            <span>Preview & Bulk Send</span>
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Preview Layout</span>
          </button>

          <button
            onClick={() => setIsTestEmailModalOpen(true)}
            className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-500 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4 text-cyan-500" />
            <span>Send Test</span>
          </button>
        </div>
      </header>

      {/* Batch AI Progress Banner */}
      {isBatchCategorizing && (
        <div className="p-4 bg-purple-500 border border-purple-500/30 rounded-2xl flex items-center justify-between text-xs text-purple-300 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="font-mono font-bold">{batchProgress}</span>
          </div>
          <span className="text-[10px] bg-purple-500 px-2 py-1 rounded font-bold uppercase">AI Batch Core</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left List of Templates */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-2">
                <LayoutTemplate className="w-3.5 h-3.5 text-emerald-500" />
                Notification Events
              </h3>
              <div className="flex items-center gap-1">
                {(selectedCategoryFilter !== 'All' || selectedStatusFilter !== 'All' || selectedFolderFilter !== 'All' || selectedFolderTypeView !== 'All' || templateSearchQuery.trim() !== '') && (
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('All');
                      setSelectedStatusFilter('All');
                      setSelectedFolderFilter('All');
                      setSelectedFolderTypeView('All');
                      setTemplateSearchQuery('');
                    }}
                    className="text-[9px] font-bold text-amber-500 hover:underline mr-1"
                  >
                    Reset
                  </button>
                )}
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-emerald-400 text-[9px] font-mono">
                  {filteredTemplates.length} / {TEMPLATE_KEYS.length}
                </span>
              </div>
            </div>

            {/* Template Quick Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="🔍 Search templates..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Organizational Folders Filter Bar */}
            <div className="mb-3 p-2.5 bg-blue-500 dark:bg-blue-500 rounded-xl border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-blue-500" />
                  Folders / Departments:
                </div>
                <button
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="text-[9px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-0.5 hover:underline"
                >
                  <FolderPlus className="w-3 h-3" />
                  + Folder
                </button>
              </div>

              {/* Folder Type View Switcher (All / Department / Region) */}
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/10">
                {(['All', 'Department', 'Region'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedFolderTypeView(type);
                      setSelectedFolderFilter('All');
                    }}
                    className={`py-0.5 text-[8.5px] font-bold rounded ${
                      selectedFolderTypeView === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-[#0F172A] hover:text-[#1E293B] dark:hover:text-[#1E293B]'
                    }`}
                  >
                    {type === 'All' ? 'All Types' : type === 'Department' ? 'Depts' : 'Regions'}
                  </button>
                ))}
              </div>

              {/* Folder Dropdown Select */}
              <select
                value={selectedFolderFilter}
                onChange={(e) => setSelectedFolderFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-lg p-1.5 text-[10px] font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="All">📁 All Organizational Folders ({getAllFolders().length})</option>
                <optgroup label="🏢 Department Folders">
                  {getAllFolders().filter(f => f.type === 'Department').map(f => (
                    <option key={f.id} value={f.id}>
                      🏢 {f.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Regulatory Region Folders">
                  {getAllFolders().filter(f => f.type === 'Region').map(f => (
                    <option key={f.id} value={f.id}>
                      🌐 {f.name}
                    </option>
                  ))}
                </optgroup>
                {getAllFolders().filter(f => f.type === 'General').length > 0 && (
                  <optgroup label="📂 Custom General Folders">
                    {getAllFolders().filter(f => f.type === 'General').map(f => (
                      <option key={f.id} value={f.id}>
                        📂 {f.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Category Filter Bar */}
            <div className="mb-2 space-y-1">
              <div className="text-[9px] font-bold uppercase text-[#0F172A] flex items-center gap-1 mb-1">
                <Filter className="w-3 h-3 text-purple-400" />
                Category:
              </div>
              <div className="flex flex-wrap gap-1">
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all ${
                      selectedCategoryFilter === cat
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Status Filter Bar */}
            <div className="mb-3 space-y-1">
              <div className="text-[9px] font-bold uppercase text-[#0F172A] flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-amber-500" />
                Quality Approval Status:
              </div>
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTER_OPTIONS.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all ${
                      selectedStatusFilter === st
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Auto Categorize Trigger */}
            <button
              onClick={handleBatchCategorizeAll}
              disabled={isBatchCategorizing}
              className="w-full mb-3 py-1.5 px-2 bg-purple-500 hover:bg-purple-500 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-70"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Batch Auto-Categorize All</span>
            </button>

            <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {filteredTemplates.map(t => {
                const isCustomized = !!systemOptions?.emailOverrides?.[t.id];
                const isSel = selectedTemplate === t.id;
                const catData = getTemplateCategoryData(t.id);
                const statusData = getTemplateStatusData(t.id);
                const statusBadgeStyle = getStatusBadgeStyle(statusData.status);
                const tFolderId = getTemplateFolderId(t.id);
                const tFolderObj = getFolderById(tFolderId);

                return (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    className={`text-left p-3 rounded-xl transition-all border ${
                      isSel
                        ? 'bg-emerald-500 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold leading-snug">{t.name}</span>
                      {isCustomized && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-cyan-500 text-cyan-400 uppercase shrink-0 ml-1">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Folder, Category & Workflow Status Badges */}
                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase border flex items-center gap-1 ${
                        tFolderObj.type === 'Department'
                          ? 'bg-blue-500 text-blue-700 dark:text-blue-300 border-blue-500/30'
                          : tFolderObj.type === 'Region'
                          ? 'bg-indigo-500 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-500 text-[#0F172A] dark:text-white border-slate-500/30'
                      }`}>
                        {tFolderObj.type === 'Department' ? <Building2 className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                        {tFolderObj.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase border ${getCategoryBadgeStyle(catData.category)}`}>
                        {catData.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase border ${statusBadgeStyle.bg}`}>
                        {statusBadgeStyle.label}
                      </span>
                    </div>

                    <div className="text-[9px] opacity-70 leading-tight line-clamp-2">{t.description}</div>

                    {/* Tags preview */}
                    {catData.tags && catData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-slate-100 dark:border-white/10">
                        {catData.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[8px] font-mono bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white px-1.5 py-0.2 rounded">
                            #{tag}
                          </span>
                        ))}
                        {catData.tags.length > 2 && (
                          <span className="text-[8px] font-mono text-[#0F172A]">
                            +{catData.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Editor Center */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-[#0F172A] dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    {activeTemplateObj?.name}
                  </h3>

                  {/* Active Category Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${getCategoryBadgeStyle(currentCategoryData.category)}`}>
                    <Tag className="w-3 h-3" />
                    {currentCategoryData.category}
                  </span>

                  {/* Active Folder Badge */}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 bg-blue-500 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    {currentFolderObj.type === 'Department' ? <Building2 className="w-3 h-3 text-blue-400" /> : <MapPin className="w-3 h-3 text-indigo-400" />}
                    {currentFolderObj.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-[#0F172A] dark:text-white">
                    ID: <code className="text-emerald-500 font-mono">{selectedTemplate}</code>
                  </p>

                  {/* Inline Re-Categorize Button */}
                  <button
                    onClick={() => handleAICategorizeTemplate(selectedTemplate)}
                    disabled={isCategorizing}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Re-Categorize with AI
                  </button>
                </div>

                {/* Display Current Tags */}
                {currentCategoryData.tags && currentCategoryData.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[#0F172A] font-bold uppercase">Tags:</span>
                    {currentCategoryData.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white text-[10px] font-mono border border-slate-200 dark:border-white/10">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Visual vs HTML Code Toggle */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
                  <button
                    onClick={() => setEditMode('visual')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition ${
                      editMode === 'visual'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-[#0F172A] hover:text-white'
                    }`}
                  >
                    Visual Editor
                  </button>
                  <button
                    onClick={() => setEditMode('code')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition flex items-center gap-1 ${
                      editMode === 'code'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-[#0F172A] hover:text-white'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    HTML Source
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-[#0F172A]">Enable Email:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Organizational Folder Location Banner */}
            <div className="mb-4 p-4 rounded-2xl border bg-blue-500 dark:bg-blue-950 border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className="p-2.5 bg-blue-500 text-blue-500 dark:text-blue-400 rounded-xl border border-blue-500/30 flex items-center justify-center shrink-0">
                  {currentFolderObj.type === 'Department' ? <Building2 className="w-5 h-5" /> : currentFolderObj.type === 'Region' ? <MapPin className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F172A]">Organizational Folder:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {currentFolderObj.name} ({currentFolderObj.type})
                    </span>
                  </div>
                  <p className="text-xs text-[#0F172A] dark:text-white mt-0.5 leading-relaxed">
                    {currentFolderObj.description || 'Assigned to organizational group for regulatory tracking and department access control.'}
                  </p>
                </div>
              </div>

              {/* Quick Folder Switcher Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase text-[#0F172A]">Move Folder:</span>
                <select
                  value={currentFolderId}
                  onChange={(e) => handleAssignFolderToTemplate(selectedTemplate, e.target.value)}
                  className="bg-white dark:bg-slate-900 text-[#1E293B] dark:text-slate-100 border border-blue-500/30 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                >
                  <optgroup label="🏢 Department Folders">
                    {getAllFolders().filter(f => f.type === 'Department').map(f => (
                      <option key={f.id} value={f.id}>🏢 {f.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌐 Regulatory Region Folders">
                    {getAllFolders().filter(f => f.type === 'Region').map(f => (
                      <option key={f.id} value={f.id}>🌐 {f.name}</option>
                    ))}
                  </optgroup>
                  {getAllFolders().filter(f => f.type === 'General').length > 0 && (
                    <optgroup label="📂 Custom General Folders">
                      {getAllFolders().filter(f => f.type === 'General').map(f => (
                        <option key={f.id} value={f.id}>📂 {f.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="p-1.5 bg-blue-500 hover:bg-blue-500 text-blue-400 rounded-xl border border-blue-500/30 transition-all flex items-center gap-1 text-[10px] font-bold"
                  title="Create New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ New</span>
                </button>
              </div>
            </div>

            {/* Quality Control & Workflow Status Banner */}
            <div className="mb-6 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${currentStatusBadge.bg}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F172A]">Quality Control Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${currentStatusBadge.bg}`}>
                      {currentStatusBadge.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#0F172A] dark:text-white mt-1 leading-relaxed">
                    {currentStatusData.status === 'Draft' && "Template is in Draft mode. Editing allowed. Quality control review ('Request Approval') is required before marking as Global or Live."}
                    {currentStatusData.status === 'Pending Approval' && `Awaiting Quality Control Review. Requested by ${currentStatusData.requestedBy || 'Administrator'}${currentStatusData.requestedAt ? ' on ' + new Date(currentStatusData.requestedAt).toLocaleDateString() : ''}.`}
                    {currentStatusData.status === 'Approved' && `Approved by ${currentStatusData.approvedBy || 'Compliance Admin'}${currentStatusData.approvedAt ? ' on ' + new Date(currentStatusData.approvedAt).toLocaleDateString() : ''}. Cleared for Global platform deployment.`}
                    {currentStatusData.status === 'Global / Live' && "Template is published as Global / Live across active notification dispatchers."}
                  </p>
                  {currentStatusData.rejectionReason && currentStatusData.status === 'Draft' && (
                    <div className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Revision Required: {currentStatusData.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Workflow Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {currentStatusData.status === 'Draft' && (
                  <button
                    onClick={handleOpenRequestApproval}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    Request Approval
                  </button>
                )}

                {currentStatusData.status === 'Pending Approval' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      className="px-3 py-2 bg-rose-500 hover:bg-rose-500 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject to Draft
                    </button>
                    <button
                      onClick={() => setIsApproveModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Template
                    </button>
                  </div>
                )}

                {currentStatusData.status === 'Approved' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRevertToDraft}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-white text-[#0F172A] dark:text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      Return to Draft
                    </button>
                    <button
                      onClick={handlePublishGlobal}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
                    >
                      <Globe className="w-4 h-4" />
                      Mark as Global / Live
                    </button>
                  </div>
                )}

                {currentStatusData.status === 'Global / Live' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRevertToDraft}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-white text-[#0F172A] dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      Move to Draft for Edits
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Version History Drawer / Banner */}
            {showVersionHistory && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Template Version History & Revert Console
                  </h4>
                  <button 
                    onClick={() => setShowVersionHistory(false)}
                    className="text-[#0F172A] hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {currentVersions.length === 0 ? (
                  <p className="text-xs text-[#0F172A] py-3 text-center">
                    No previous version records stored yet. Click "Save Template Globals" to create version v1.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {currentVersions.map((ver) => (
                      <div 
                        key={ver.version}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-500 bg-emerald-500 px-2 py-0.5 rounded text-[10px]">
                              v{ver.version}
                            </span>
                            <span className="font-semibold text-[#0F172A] dark:text-white truncate max-w-xs">
                              {ver.subject}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#0F172A] mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#0F172A]" />
                              {new Date(ver.timestamp).toLocaleString()}
                            </span>
                            <span>By: {ver.author}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setRevertConfirmVersion(ver)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-500 text-amber-500 border border-amber-500/30 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1.5 transition-all shrink-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revert to v{ver.version}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1.5 ml-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="e.g. Action Required: Account Security Notice"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] flex items-center gap-2">
                    Template HTML Body Content
                  </label>
                  <span className="text-cyan-500 text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Available Placeholders: <code className="bg-cyan-500 px-1 py-0.5 rounded text-[9.5px]">{"{{name}}"}</code> <code className="bg-cyan-500 px-1 py-0.5 rounded text-[9.5px]">{"{{amount}}"}</code> <code className="bg-cyan-500 px-1 py-0.5 rounded text-[9.5px]">{"{{date}}"}</code> <code className="bg-cyan-500 px-1 py-0.5 rounded text-[9.5px]">{"{{reference}}"}</code> <code className="bg-cyan-500 px-1 py-0.5 rounded text-[9.5px]">{"{{action_url}}"}</code>
                  </span>
                </div>

                {editMode === 'visual' ? (
                  <div className="h-72 mb-12 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
                    <ReactQuill 
                      theme="snow" 
                      value={body} 
                      onChange={setBody} 
                      className="h-full"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{'list': 'ordered'}, {'list': 'bullet'}],
                          ['link'],
                          [{ 'color': [] }, { 'background': [] }],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-100 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-black/5 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  />
                )}
              </div>

              {/* Bottom Action Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <div>
                  {saveSuccess && (
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveSuccess}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleAICategorizeTemplate(selectedTemplate)}
                    disabled={isCategorizing}
                    className="px-4 py-2.5 bg-purple-500 hover:bg-purple-500 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
                    <span>Categorize</span>
                  </button>

                  <button
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-white text-[#1E293B] dark:text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10"
                  >
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Preview
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-white hover:bg-slate-700 text-white border border-black/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-70 dark:bg-slate-800"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Draft
                  </button>

                  <button
                    onClick={handlePublishGlobal}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Mark as Global / Live
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI CATEGORIZATION MODAL */}
      {isCategoryModalOpen && activeCategoryResult && (
        <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-purple-500/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
            {/* Top Glowing Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500 rounded-2xl border border-purple-500/30">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    AI Template Categorization & Tagging
                  </h3>
                  <p className="text-xs text-[#0F172A]">
                    Gemini 3.6 Flash Content Analysis for <span className="text-emerald-400 font-bold">{activeTemplateObj?.name}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-[#0F172A] hover:text-white hover:bg-white transition dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Primary Category Recommendation Box */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] block mb-1">
                    AI Primary Category Classification
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getCategoryBadgeStyle(activeCategoryResult.category)}`}>
                      {activeCategoryResult.category}
                    </span>
                    <span className="text-xs text-[#0F172A] font-mono">
                      ({Math.round(activeCategoryResult.confidence * 100)}% Confidence)
                    </span>
                  </div>
                </div>

                {activeCategoryResult.suggestedFolder && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] block mb-1">
                      Suggested Folder
                    </span>
                    <span className="text-xs font-mono text-purple-400 font-bold flex items-center gap-1 justify-end">
                      <Folder className="w-3.5 h-3.5" />
                      {activeCategoryResult.suggestedFolder}
                    </span>
                  </div>
                )}
              </div>

              {/* Rationale Explanation */}
              <div className="p-3.5 bg-purple-500 border border-purple-500/20 rounded-xl text-xs text-purple-200 leading-relaxed">
                <span className="font-bold text-purple-400 block mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  AI Rationale & Purpose Evaluation:
                </span>
                {activeCategoryResult.rationale}
              </div>

              {/* Interactive Tag Management */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-2">
                  Suggested Organizational Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeCategoryResult.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-white text-[#1E293B] border border-black/5 rounded-xl text-xs font-mono flex items-center gap-2 dark:bg-slate-800"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#0F172A] hover:text-rose-400 text-xs font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Custom Tag Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                    placeholder="Add custom tag (e.g., VIP Outreach)..."
                    className="flex-1 bg-slate-100 border border-black/5 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <button
                    onClick={handleAddCustomTag}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleApplyCategorization}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply & Save Category Tags
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-black/5 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl dark:bg-slate-900">
            <div className="p-4 bg-slate-100 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Template Live Preview ({activeTemplateObj?.name})
                  </h3>
                  <p className="text-[10px] text-[#0F172A] font-mono">
                    Populated with dynamic customer dummy data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Device Frame Switcher */}
                <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-black/5 dark:bg-slate-900">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      previewDevice === 'desktop' ? 'bg-indigo-500 text-white' : 'text-[#0F172A] hover:text-white'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      previewDevice === 'mobile' ? 'bg-indigo-500 text-white' : 'text-[#0F172A] hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#0F172A] hover:text-white hover:bg-white transition dark:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subject Line Bar */}
            <div className="p-3 bg-slate-50 border-b border-black/5 font-mono text-xs text-[#0F172A] flex items-center gap-2 dark:bg-slate-900">
              <span className="text-[#0F172A] uppercase font-bold text-[10px]">Subject:</span>
              <span className="text-emerald-400 font-bold">{previewRender.subject}</span>
            </div>

            {/* Rendered Frame Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center custom-scrollbar">
              <div 
                className={`bg-white transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl ${
                  previewDevice === 'mobile' ? 'w-[375px] my-4 ring-8 ring-slate-800' : 'w-full max-w-2xl'
                }`}
              >
                <iframe
                  title="Template Preview"
                  srcDoc={previewRender.html}
                  className="w-full h-[550px] border-0"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-black/5 flex items-center justify-between text-xs text-[#0F172A]">
              <span className="text-[10px]">Verify styling and branding footer layout before publishing.</span>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-white text-white rounded-lg font-bold text-xs dark:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST EMAIL MODAL */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-black/5 rounded-3xl w-full max-w-md p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                Dispatch Test Email
              </h3>
              <button onClick={() => setIsTestEmailModalOpen(false)} className="text-[#0F172A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#0F172A] mb-4 leading-relaxed">
              Dispatch a test email rendered with your current HTML template and dummy data to verify inbox rendering.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  className="w-full bg-slate-100 border border-black/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {testEmailStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  testEmailStatus.includes('successfully') ? 'bg-emerald-500 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500 text-rose-400 border border-rose-500/20'
                }`}>
                  {testEmailStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsTestEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isSendingTestEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Dispatch Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVERT CONFIRMATION MODAL */}
      {revertConfirmVersion && (
        <div className="fixed inset-0 z-[110] bg-slate-100  flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-black/5 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center dark:bg-slate-900">
            <RotateCcw className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-black text-white mb-1">
              Revert to Version v{revertConfirmVersion.version}?
            </h3>
            <p className="text-xs text-[#0F172A] mb-6">
              This will load subject "<span className="text-white">{revertConfirmVersion.subject}</span>" back into the editor canvas.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setRevertConfirmVersion(null)}
                className="px-4 py-2 bg-white hover:bg-slate-700 text-white rounded-xl text-xs font-bold dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevertVersion(revertConfirmVersion)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Confirm Revert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST APPROVAL MODAL */}
      {isRequestApprovalModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 rounded-2xl border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Request Quality Control Approval
                  </h3>
                  <p className="text-xs text-[#0F172A]">
                    Template: <span className="text-emerald-400 font-bold">{activeTemplateObj?.name}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsRequestApprovalModalOpen(false)} className="text-[#0F172A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Mandatory Quality Control Checklist */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block mb-1">
                  Quality Control Verification Checklist
                </span>

                <label className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecks.subjectVerified}
                    onChange={(e) => setQcChecks({ ...qcChecks, subjectVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <span>Subject line syntax & dynamic placeholders verified</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecks.layoutTested}
                    onChange={(e) => setQcChecks({ ...qcChecks, layoutTested: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <span>Desktop & mobile visual preview layout rendering verified</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcChecks.complianceApproved}
                    onChange={(e) => setQcChecks({ ...qcChecks, complianceApproved: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <span>Institutional compliance & security disclaimer footer reviewed</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Administrator Submission Notes / Scope of Changes
                </label>
                <textarea
                  rows={3}
                  value={approvalRequestNotes}
                  onChange={(e) => setApprovalRequestNotes(e.target.value)}
                  placeholder="e.g. Updated welcome header text and verified branding colors for Q3 release..."
                  className="w-full bg-slate-100 border border-black/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <button
                  onClick={() => setIsRequestApprovalModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmitRequestApproval}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  Submit Request for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE TEMPLATE MODAL */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 rounded-2xl border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Approve Template for Release
                  </h3>
                  <p className="text-xs text-[#0F172A]">
                    Template: <span className="text-emerald-400 font-bold">{activeTemplateObj?.name}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-[#0F172A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#0F172A] leading-relaxed">
                Approving this template clears Quality Control requirements. An administrator will then be able to mark this template as <strong>Global / Ready for Deployment</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Quality Reviewer Approval Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={approvalReviewerNotes}
                  onChange={(e) => setApprovalReviewerNotes(e.target.value)}
                  placeholder="e.g. Quality control check passed. Approved for live production dispatch."
                  className="w-full bg-slate-100 border border-black/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/5">
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveTemplateSubmit}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Quality Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT TEMPLATE MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500 rounded-2xl border border-rose-500/30">
                  <XCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Reject & Return to Draft
                  </h3>
                  <p className="text-xs text-[#0F172A]">
                    Template: <span className="text-emerald-400 font-bold">{activeTemplateObj?.name}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-[#0F172A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#0F172A] leading-relaxed">
                Please provide feedback detailing why this template is being returned to Draft status for revision.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Required Rejection / Revision Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Please update button text contrast and correct typo in paragraph 2..."
                  className="w-full bg-slate-100 border border-black/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/5">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectTemplateSubmit}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Return to Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUALITY CONTROL GATE PROTECTION MODAL */}
      {isGateBlockedModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-center dark:bg-slate-900">
            <div className="p-3 bg-amber-500 rounded-2xl border border-amber-500/30 inline-flex mb-3">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">
              Quality Control Gate Active
            </h3>

            <p className="text-xs text-[#0F172A] leading-relaxed mb-6 px-2">
              {gateBlockedMessage}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsGateBlockedModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-700 text-white rounded-xl text-xs font-bold dark:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsGateBlockedModalOpen(false);
                  handleOpenRequestApproval();
                }}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                Request Approval Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ORGANIZATIONAL FOLDER MODAL */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-blue-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500 rounded-2xl border border-blue-500/30">
                  <FolderPlus className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Create Organizational Folder
                  </h3>
                  <p className="text-xs text-[#0F172A]">
                    Group templates by department or regulatory jurisdiction
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="text-[#0F172A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. APAC Commercial Credit or Fraud Security"
                  className="w-full bg-slate-100 border border-black/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Organizational Folder Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Department', 'Region', 'General'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewFolderType(type)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        newFolderType === type
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-100 text-[#0F172A] border-black/5 hover:bg-white'
                      }`}
                    >
                      {type === 'Department' ? <Building2 className="w-4 h-4" /> : type === 'Region' ? <MapPin className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-1">
                  Folder Description / Regulatory Scope (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="e.g. Templates governing commercial loan notifications under MAS regulatory jurisdiction..."
                  className="w-full bg-slate-100 border border-black/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5">
                <button
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#0F172A] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolderSubmit}
                  disabled={!newFolderName.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL EMAIL TEMPLATE PREVIEWER & BULK DISPATCH MODAL */}
      <AdminEmailTemplatePreviewerModal
        isOpen={isFullPreviewerOpen}
        onClose={() => setIsFullPreviewerOpen(false)}
        allUsers={allUsers}
      />
    </div>
  );
};
