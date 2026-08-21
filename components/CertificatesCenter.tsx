import React, { useState, useEffect } from 'react';
import { 
  Award, 
  FileCheck, 
  FileText, 
  Printer, 
  Mail, 
  Check, 
  Loader2, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  ChevronRight,
  Sparkles,
  Percent,
  Calendar,
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react';
import { sendEmail, generateCertificateEmail, generateCreditCertificateEmail } from '../services/emailService';
import { Account, UserProfile } from '../types';
import { BRANDING_CONFIG } from './constants';

interface Certificate {
  id: string;
  serialNumber: string;
  type: 'deposit' | 'credit';
  title: string;
  fullName: string;
  accountName: string;
  accountLastFour: string;
  amount: number;
  apy: number;
  issueDate: string;
  maturityDate: string;
  status: 'ACTIVE' | 'MATURED' | 'PENDING';
  hashSignature: string;
  insuranceLimit: string;
  // Credit specific fields
  creditLimit?: number;
  collateralValue?: number;
  creditScore?: number;
}

interface CertificatesCenterProps {
  accounts: Account[];
  userProfile: UserProfile;
  addNotification: (type: any, title: string, message: string) => void;
}

export const CertificatesCenter: React.FC<CertificatesCenterProps> = ({ 
  accounts, 
  userProfile,
  addNotification 
}) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'credit' | 'issue'>('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  
  // Issuing wizard state
  const [wizardType, setWizardType] = useState<'deposit' | 'credit'>('deposit');
  const [wizardAccount, setWizardAccount] = useState<string>('');
  const [wizardAmount, setWizardAmount] = useState<string>('');
  const [wizardTerm, setWizardTerm] = useState<string>('12'); // months
  const [isIssuing, setIsIssuing] = useState(false);
  const [isEmailing, setIsEmailing] = useState<string | null>(null);

  // Seed default premium certificates
  useEffect(() => {
    const savedCerts = localStorage.getItem(`certs_${userProfile.email}`);
    if (savedCerts) {
      setCertificates(JSON.parse(savedCerts));
    } else {
      const mainAccount = accounts[0];
      const mainName = mainAccount?.nickname || 'Savings Core';
      const mainLastFour = mainAccount?.accountNumber ? mainAccount.accountNumber.slice(-4) : '8829';
      const seed: Certificate[] = [
        {
          id: 'cert_1',
          serialNumber: 'CD-5928-XA72',
          type: 'deposit',
          title: 'Premium Certificate of Deposit',
          fullName: userProfile.name || 'Lachy McLean',
          accountName: mainName,
          accountLastFour: mainLastFour,
          amount: 250000,
          apy: 5.45,
          issueDate: '2026-01-15',
          maturityDate: '2027-01-15',
          status: 'ACTIVE',
          hashSignature: '9af2c6be3810a9bc475ebd9efef012948bcd0a38dcf7832bc98342ca019abff2831a2bcc',
          insuranceLimit: '$250,000.00 (FDIC OCC Guarded)'
        },
        {
          id: 'cert_2',
          serialNumber: 'CR-8291-SL90',
          type: 'credit',
          title: 'Sovereign Solvency Enclave Credit Certificate',
          fullName: userProfile.name || 'Lachy McLean',
          accountName: 'Private Equity Reserve',
          accountLastFour: '401A',
          amount: 500000,
          apy: 0,
          issueDate: '2026-03-10',
          maturityDate: '2028-03-10',
          status: 'ACTIVE',
          hashSignature: 'fbc82942ca0a1cba72bbddd38e01928facbd0f38d1029ab8f8fa71e86a048a1728bb88ee1',
          insuranceLimit: 'Fully Backed Custodial Asset Collar',
          creditLimit: 500000,
          collateralValue: 1250000,
          creditScore: 825
        }
      ];
      setCertificates(seed);
      localStorage.setItem(`certs_${userProfile.email}`, JSON.stringify(seed));
    }
  }, [userProfile, accounts]);

  const saveCertificates = (certs: Certificate[]) => {
    setCertificates(certs);
    localStorage.setItem(`certs_${userProfile.email}`, JSON.stringify(certs));
  };

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardAmount || parseFloat(wizardAmount) <= 0) {
      alert('Please enter a valid certificate volume.');
      return;
    }

    const matchedAccount = accounts.find(a => a.id === wizardAccount) || accounts[0];
    if (!matchedAccount) {
      alert('Please link a backing account first.');
      return;
    }

    const amt = parseFloat(wizardAmount);
    if ((matchedAccount?.balance || 0) < amt) {
      alert(`Insufficient funds in ${matchedAccount.nickname}. Available balance is $${(matchedAccount?.balance || 0).toLocaleString()}.`);
      return;
    }

    setIsIssuing(true);

    setTimeout(() => {
      const months = parseInt(wizardTerm);
      const apyRate = months === 6 ? 4.95 : months === 12 ? 5.45 : months === 36 ? 5.85 : 5.15;
      
      const today = new Date();
      const issueDateStr = today.toISOString().split('T')[0];
      const maturityDate = new Date();
      maturityDate.setMonth(today.getMonth() + months);
      const maturityDateStr = maturityDate.toISOString().split('T')[0];

      const serialId = Math.floor(1000 + Math.random() * 9000);
      const randHex = Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

      const mNickname = matchedAccount.nickname || 'Core Account';
      const mLastFour = matchedAccount.accountNumber ? matchedAccount.accountNumber.slice(-4) : '0000';

      const newCert: Certificate = wizardType === 'deposit' ? {
        id: `cert_${Date.now()}`,
        serialNumber: `CD-${serialId}-XA${Math.floor(10 + Math.random() * 90)}`,
        type: 'deposit',
        title: 'Premium Certificate of Deposit',
        fullName: userProfile.name,
        accountName: mNickname,
        accountLastFour: mLastFour,
        amount: amt,
        apy: apyRate,
        issueDate: issueDateStr,
        maturityDate: maturityDateStr,
        status: 'ACTIVE',
        hashSignature: randHex,
        insuranceLimit: '$250,000.00 (FDIC OCC Guarded)'
      } : {
        id: `cert_${Date.now()}`,
        serialNumber: `CR-${serialId}-SL${Math.floor(10 + Math.random() * 90)}`,
        type: 'credit',
        title: 'Sovereign Credit Certificate',
        fullName: userProfile.name,
        accountName: mNickname,
        accountLastFour: mLastFour,
        amount: amt,
        apy: 0,
        issueDate: issueDateStr,
        maturityDate: maturityDateStr,
        status: 'ACTIVE',
        hashSignature: randHex,
        insuranceLimit: 'Fully Backed Custodial Asset Collar',
        creditLimit: amt,
        collateralValue: Math.round(amt * 2.5),
        creditScore: Math.floor(780 + Math.random() * 65)
      };

      const updated = [newCert, ...certificates];
      saveCertificates(updated);
      
      // Send alerts
      addNotification(
        'SECURITY', 
        'New Certificate Issued', 
        `Your official ${newCert.type === 'deposit' ? 'Deposit Certificate' : 'Credit Certificate'} has been registered on the institutional ledger.`
      );

      // Reset form variables
      setWizardAmount('');
      setIsIssuing(false);
      setSelectedCert(newCert); // open preview immediately
      addNotification('GENERAL', 'Certificate Registered', 'Document successfully generated. Launching live on-screen credential dossier.');
    }, 1500);
  };

  const handleSendEmail = async (cert: Certificate) => {
    setIsEmailing(cert.id);
    
    let emailHtml = '';
    const subject = `[OFFICIAL LEDGER TRANS] Institutional Certificate - ${cert.serialNumber}`;

    if (cert.type === 'deposit') {
      emailHtml = generateCertificateEmail({
        fullName: cert.fullName,
        accountLastFour: cert.accountLastFour,
        accountName: cert.accountName,
        serialNumber: cert.serialNumber,
        amount: cert.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        apy: cert.apy.toString(),
        issueDate: cert.issueDate,
        maturityDate: cert.maturityDate,
        hashSignature: cert.hashSignature,
        insuranceLimit: cert.insuranceLimit
      });
    } else {
      emailHtml = generateCreditCertificateEmail({
        fullName: cert.fullName,
        accountLastFour: cert.accountLastFour,
        serialNumber: cert.serialNumber,
        creditLimit: (cert.creditLimit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        collateralValue: (cert.collateralValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        creditScore: (cert.creditScore ?? 800).toString(),
        status: cert.status,
        issueDate: cert.issueDate,
        hashSignature: cert.hashSignature
      });
    }

    try {
      const res = await sendEmail(userProfile.email, subject, emailHtml);
      if (res.success) {
        addNotification(
          'GENERAL', 
          'Email Certificate Dispatched', 
          `Official certificate ${cert.serialNumber} with high realism headers and logo was transmitted successfully to: ${userProfile.email}`
        );
        alert(`Institutional certificate successfully dispatched to ${userProfile.email}. Check your inbox! It contains formal US banking headers, FDIC stamps, and the official bank logo fully functional.`);
      } else {
        alert(`Sovereign dispatch failed: ${res.error}. However, certificate remains valid on screen and saved on the ledger.`);
      }
    } catch (e: any) {
      alert(`Network error during secure dispatch: ${e.message}`);
    } finally {
      setIsEmailing(null);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const filteredCerts = certificates.filter(c => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24" id="certificates-center-portal">
      {/* Header and top branding banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">
            Institutional Certificates
          </h2>
          <p className="text-[#0F172A] dark:text-white font-bold">
            Generate and view real-time premium US Deposit Certificates and Credit Lines.
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'all' ? 'bg-white text-[#0F172A] dark:bg-slate-700 dark:text-white shadow-sm' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white'}`}
          >
            All Docs
          </button>
          <button 
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'deposit' ? 'bg-white text-[#0F172A] dark:bg-slate-700 dark:text-white shadow-sm' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white'}`}
          >
            Deposit Certs (CD)
          </button>
          <button 
            onClick={() => setActiveTab('credit')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'credit' ? 'bg-white text-[#0F172A] dark:bg-slate-700 dark:text-white shadow-sm' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white'}`}
          >
            Credit Letters
          </button>
          <button 
            onClick={() => setActiveTab('issue')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-emerald-500 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 ${activeTab === 'issue' ? '!bg-emerald-500 !text-slate-950 font-black' : ''}`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Issue Custom
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      {activeTab !== 'issue' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => (
            <div 
              key={cert.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border ${cert.type === 'deposit' ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-emerald-500/20 hover:border-emerald-500/40'} p-6 transition-all shadow-xl hover:-translate-y-1 relative overflow-hidden group`}
            >
              {/* Subtle radial sheen glow based on type */}
              <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-40 ${cert.type === 'deposit' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${cert.type === 'deposit' ? 'bg-amber-500 text-amber-500 border border-amber-500/20' : 'bg-emerald-500 text-emerald-500 border border-emerald-500/20'}`}>
                  {cert.type === 'deposit' ? <Award className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-[#0F172A] uppercase tracking-widest block">Serial Ledger Node</span>
                  <span className="text-xs font-mono font-bold text-[#1E293B] dark:text-amber-500">{cert.serialNumber}</span>
                </div>
              </div>

              <div className="my-5 space-y-2 relative z-10">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cert.type === 'deposit' ? 'bg-amber-500 text-amber-500 border border-amber-500/15' : 'bg-emerald-500 text-emerald-500 border border-emerald-500/15'}`}>
                  {cert.type === 'deposit' ? 'CERTIFICATE OF DEPOSIT' : 'SOLVENCY CREDIT RESOLUTION'}
                </span>
                <h4 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight uppercase mt-2">
                  {cert.title}
                </h4>
                <div className="flex justify-between items-end pt-4 border-t border-slate-100 dark:border-white/10">
                  <div>
                    <span className="text-[9px] text-[#0F172A] block uppercase">Liquid Volume Backing</span>
                    <span className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight font-mono">
                      ${cert.amount.toLocaleString()}
                    </span>
                  </div>
                  {cert.apy > 0 && (
                    <div className="text-right bg-amber-500 px-2 bg-slate-50 dark:bg-slate-800 py-1.5 rounded-lg border border-amber-500/15">
                      <span className="text-[8px] text-amber-500 block uppercase font-bold tracking-tight">yield value</span>
                      <span className="text-xs font-black text-amber-500 font-mono">{cert.apy}% APY</span>
                    </div>
                  )}
               </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl space-y-1.5 border border-slate-100 dark:border-white/10 text-[10px] text-[#0F172A] dark:text-white relative z-10">
                <div className="flex justify-between">
                  <span>Owner Account:</span>
                  <span className="font-bold text-[#0F172A] dark:text-white uppercase">{cert.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Routing Source:</span>
                  <span className="font-mono">{cert.accountName} (*{cert.accountLastFour})</span>
                </div>
                {cert.creditScore !== undefined && (
                  <div className="flex justify-between">
                    <span>Credit Score Match:</span>
                    <span className="font-bold text-emerald-400">{cert.creditScore} (EXCELLENT A+)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Value Date:</span>
                  <span>{cert.issueDate}</span>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 relative z-10">
                <button
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white text-[#0F172A] dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  View Dossier
                </button>
                <button
                  type="button"
                  disabled={isEmailing !== null}
                  onClick={() => handleSendEmail(cert)}
                  className={`px-4 py-2.5 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${cert.type === 'deposit' ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-400 hover:bg-emerald-500'}`}
                >
                  {isEmailing === cert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>Email</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl p-6 md:p-8 animate-fade-in-up">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-white/10">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                Certificate Issuing Terminal
              </h3>
              <p className="text-xs text-[#0F172A] dark:text-white">
                Leverage linked asset core limits to authorize new ledger certification documents instantly.
              </p>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-6">
              {/* Document Type Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-2.5 block">
                  Select Certificate Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWizardType('deposit')}
                    className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${wizardType === 'deposit' ? 'bg-slate-500 border-amber-500 text-slate-950 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'}`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${wizardType === 'deposit' ? 'bg-amber-500 text-amber-500' : 'bg-slate-200 dark:bg-slate-900 text-[#0F172A]'}`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase">Deposit Certificate</p>
                      <p className="text-[10px] mt-0.5 font-bold leading-relaxed">Locks funds to gain high-interest APY gains.</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardType('credit')}
                    className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${wizardType === 'credit' ? 'bg-slate-500 border-emerald-500 text-slate-950 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'}`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${wizardType === 'credit' ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-200 dark:bg-slate-900 text-[#0F172A]'}`}>
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase">Credit Solvency</p>
                      <p className="text-[10px] mt-0.5 font-bold leading-relaxed">Secures credit limits collateralized against vaults.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Backing Account Select */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-2.5 block">
                  Routing Account Source (Ledger Core)
                </label>
                <select
                  required
                  value={wizardAccount}
                  onChange={(e) => setWizardAccount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-[#0F172A] dark:text-white"
                >
                  <option value="">-- Choose Core Asset Account --</option>
                  {accounts.map(acc => {
                    const accName = acc.nickname || 'Core Account';
                    const accLastFour = acc.accountNumber ? acc.accountNumber.slice(-4) : '0000';
                    return (
                      <option key={acc.id} value={acc.id}>
                        {accName.toUpperCase()} (*{accLastFour}) - Balance: ${(acc?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-2.5 block">
                  Certificate Liquidity Volume (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[#0F172A] font-bold">$</span>
                  <input
                    required
                    type="number"
                    min="1000"
                    placeholder="250,000"
                    value={wizardAmount}
                    onChange={(e) => setWizardAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-black font-mono focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-[#0F172A] dark:text-white"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">MIN // $1,000</span>
                  </div>
                </div>
              </div>

              {/* Deposit Specific Wizard Parameters */}
              {wizardType === 'deposit' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-2.5 block">
                    Certificate Lock Term Duration (Project APY Yield)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardTerm('6')}
                      className={`p-3 rounded-2xl border text-center transition-all ${wizardTerm === '6' ? 'bg-amber-500 border-amber-500 text-[#0F172A] dark:text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'}`}
                    >
                      <p className="text-sm font-black">6 Months</p>
                      <p className="text-[10px] font-black text-amber-500 font-mono mt-0.5">4.95% APY</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardTerm('12')}
                      className={`p-3 rounded-2xl border text-center transition-all ${wizardTerm === '12' ? 'bg-amber-500 border-amber-500 text-[#0F172A] dark:text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'}`}
                    >
                      <p className="text-sm font-black">12 Months</p>
                      <p className="text-[10px] font-black text-amber-500 font-mono mt-0.5">5.45% APY</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardTerm('36')}
                      className={`p-3 rounded-2xl border text-center transition-all ${wizardTerm === '36' ? 'bg-amber-500 border-amber-500 text-[#0F172A] dark:text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'}`}
                    >
                      <p className="text-sm font-black">36 Months</p>
                      <p className="text-[10px] font-black text-amber-500 font-mono mt-0.5">5.85% APY</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Informational Summary Alert */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/10 flex gap-3 text-[11px] font-bold text-[#0F172A] dark:text-white">
                <AlertCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white mb-0.5 uppercase tracking-wide">Ledger Certification Bylaws</p>
                  <p className="leading-relaxed">
                    By submitting this transaction, you authorize First Pacific Bank, N.A. to lock the declared capital volume. Corresponding FDIC guarantee registers will be synchronized instantly. Official physical copy is sent directly to your registered address: <strong className="text-[#0F172A] dark:text-white">{userProfile.email}</strong>.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isIssuing}
                className="w-full py-4 bg-primary hover:bg-primary-600 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-primary/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Anchoring Ledger Record...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Authorize & Issue Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Real-Time On-Screen Certificate Modal Preview */}
      {selectedCert && (
        <div className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[#0b1222] border-2 border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_30px_80px_rgba(212,175,55,0.25)] relative my-8 animate-zoom-in">
            {/* Certificate Top Safety Ribbon */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${selectedCert.type === 'deposit' ? 'from-amber-500 via-yellow-400 to-amber-600' : 'from-emerald-500 via-teal-400 to-emerald-600'}`} />
            
            {/* Close button */}
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-6 right-6 z-55 text-[#0F172A] hover:text-white font-bold bg-white p-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-white transition-all cursor-pointer dark:bg-slate-800"
            >
              ✕
            </button>

            {/* Print Header */}
            <div className="p-8 border-b border-slate-200 dark:border-white/10 flex gap-4 items-center bg-[#070c17]">
              <div className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center bg-slate-100 overflow-hidden">
                <img src={BRANDING_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain scale-[0.8]" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight">
                  {'FIRST PACIFIC PRIVATE BANKING'}
                </h4>
                <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">
                  CENTRAL REGISTER // SOLVENCY STATE CORE
                </p>
              </div>
            </div>

            {/* Certificate Body (Realism styled document) */}
            <div 
              className="p-8 md:p-12 space-y-8 bg-cover"
              style={{
                backgroundImage: `radial-gradient(circle at center, rgba(212, 175, 55, 0.04) 0%, transparent 80%)`
              }}
            >
              {/* Document Title Header Block */}
              <div className={`border rounded-2xl p-5 text-center bg-slate-50 dark:bg-slate-800  relative ${selectedCert.type === 'deposit' ? 'border-amber-500/20' : 'border-emerald-500/20'}`}>
                {/* Microprint lines */}
                <div className="absolute top-1 left-4 right-4 text-[6px] font-mono text-[#0F172A] select-none uppercase tracking-widest overflow-hidden h-3 whitespace-nowrap">
                  FIRSTPABAMICROPRINTSECURESECURITYSECURITYSECURITYSECURITYSECURESECURITY
                </div>
                
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${selectedCert.type === 'deposit' ? 'bg-amber-500 text-amber-400' : 'bg-emerald-500 text-emerald-400'}`}>
                  {selectedCert.type === 'deposit' ? 'Institutional Certificate of Deposit' : 'Sovereign Letter of Credit Solvency'}
                </span>
                <h2 className="text-2xl font-black text-white uppercase tracking-normal mt-1.5 font-serif">
                  {selectedCert.type === 'deposit' ? 'Certificate of Deposit' : 'Solvency Credit Line'}
                </h2>
                <p className="text-[9px] font-mono text-[#0F172A] uppercase tracking-widest font-bold mt-1">
                  OFFICIAL INSTRUMENT REGISTER: {selectedCert.serialNumber}
                </p>
              </div>

              {/* Legal Declaration Statement */}
              <p className="text-xs text-[#0F172A] leading-relaxed text-center font-bold font-serif italic max-w-lg mx-auto">
                "This document is a certifying statement proving solvency allocation that <strong>{selectedCert.fullName}</strong> is registered on the centralized private ledgers as holding a premium asset balance of the declared volume. This balance is collateral-matched and FDIC regulatory cleared."
              </p>

              {/* Certificate Ledger Parameter Grid */}
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-[#070c16]/50  overflow-hidden text-xs">
                <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-slate-200 dark:border-white/10">
                  <div className="p-4 space-y-1">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">certified depositor</span>
                    <span className="font-black text-[#1E293B] uppercase">{selectedCert.fullName}</span>
                  </div>
                  <div className="p-4 space-y-1 text-right">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">instrument serial</span>
                    <span className="font-mono font-black text-amber-400">{selectedCert.serialNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-slate-200 dark:border-white/10">
                  <div className="p-4 space-y-1">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">Capital Amount Backing</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">${selectedCert.amount.toLocaleString()}</span>
                  </div>
                  <div className="p-4 space-y-1 text-right">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">APY growth baseline</span>
                    <span className="text-base font-black text-amber-500 font-mono">
                      {selectedCert.apy > 0 ? `${selectedCert.apy}% APY` : 'COLLATERAL VALUE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-slate-200 dark:border-white/10">
                  <div className="p-4 space-y-1">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">initial maturity issue date</span>
                    <span className="font-bold text-[#0F172A]">{selectedCert.issueDate}</span>
                  </div>
                  <div className="p-4 space-y-1 text-right">
                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">final lock maturity date</span>
                    <span className="font-black text-[#0F172A]">{selectedCert.maturityDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 p-4 space-y-1 bg-slate-50 dark:bg-slate-800">
                  <span className="text-[8px] text-[#0F172A] uppercase tracking-widest block font-bold">Sovereign Cryptographic Node Seal Hash</span>
                  <span className="font-mono text-[9px] text-[#0F172A] select-all block break-all leading-normal">
                    {selectedCert.hashSignature}
                  </span>
                </div>
              </div>

              {/* Signature stamp section */}
              <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex gap-10">
                  <div>
                    <p className="text-[7px] text-[#0F172A] uppercase tracking-wider font-bold">Director Attest</p>
                    <p className="font-serif italic font-black text-base text-amber-200/90 leading-normal font-signature">
                      Marilyn G. Lawrence
                    </p>
                    <p className="text-[7.5px] text-[#0F172A] uppercase">Comptroller Gen</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-[#0F172A] uppercase tracking-wider font-bold">Director Attest</p>
                    <p className="font-serif italic font-black text-base text-amber-200/90 leading-normal font-signature">
                      Marcus Finch
                    </p>
                    <p className="text-[7.5px] text-[#0F172A] uppercase">Chairman of Vaults</p>
                  </div>
                </div>

                {/* Real-looking physical stamp effect */}
                <div className="flex-shrink-0">
                  <div className={`p-4 border-2 rounded-2xl text-center transform -rotate-3 text-xs font-black uppercase tracking-tight select-none select-none max-w-[130px] shadow-[0_4px_12px_rgba(16,185,129,0.1)] ${selectedCert.type === 'deposit' ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'}`}>
                    <div className="font-sans text-[10px] font-black tracking-widest">FPB TRUSTED</div>
                    <div className="border-t border-current mx-auto my-1.5 w-full" />
                    <div className="text-[8px] font-bold">LEDGER VERIFIED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom toolbar */}
            <div className="p-6 bg-[#070c17] border-t border-slate-200 dark:border-white/10 flex gap-3">
              <button
                onClick={() => handleSendEmail(selectedCert)}
                disabled={isEmailing !== null}
                className={`flex-1 py-4 text-slate-950 hover:bg-opacity-90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedCert.type === 'deposit' ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-400 hover:bg-emerald-500'}`}
              >
                {isEmailing === selectedCert.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatched Ledger Transmission...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Certified Dossier Copy to Email</span>
                  </>
                )}
              </button>
              <button
                onClick={handlePrintCertificate}
                className="px-5 py-4 bg-white hover:bg-white text-white rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 dark:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
