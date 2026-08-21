import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  UserCheck, 
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { UserProfile, KycStatus } from '../types';
import { Link } from 'react-router-dom';

interface KycProgressCardProps {
  userProfile: UserProfile;
}

export const KycProgressCard: React.FC<KycProgressCardProps> = ({ userProfile }) => {
  const kycStatus: KycStatus = userProfile.kycStatus || 'unverified';
  const kycData = userProfile.kycData;

  // Determine Tier and Progress Metrics
  let tierLabel = 'Tier 0: Basic Registration';
  let nextTierLabel = 'Tier 1: Sovereign Verified';
  let progressPercent = 25;
  let currentLimit = '$1,000 / day';
  let nextLimit = '$25,000 / day';
  let badgeColor = 'bg-amber-500 text-amber-500 border-amber-500/20';

  if (kycStatus === 'verified') {
    tierLabel = 'Tier 2: Institutional Unlocked';
    nextTierLabel = 'Tier 2 Maximum Capacity';
    progressPercent = 100;
    currentLimit = '$1,000,000+ / day';
    nextLimit = 'Unlimited Custom Reserves';
    badgeColor = 'bg-emerald-500 text-emerald-500 border-emerald-500/20';
  } else if (kycStatus === 'pending') {
    tierLabel = 'Tier 1: Pending Compliance Audit';
    nextTierLabel = 'Tier 2: Institutional Unlocked';
    progressPercent = 75;
    currentLimit = '$25,000 / day';
    nextLimit = '$1,000,000+ / day';
    badgeColor = 'bg-sky-500 text-sky-400 border-sky-500/20';
  } else if (kycStatus === 'rejected') {
    tierLabel = 'Tier 0: Flagged for Resubmission';
    nextTierLabel = 'Tier 1: Sovereign Verified';
    progressPercent = 30;
    currentLimit = 'Restricted ($0 / day)';
    nextLimit = '$25,000 / day';
    badgeColor = 'bg-rose-500 text-rose-500 border-rose-500/20';
  }

  // Determine Step States
  const hasIdDoc = Boolean(kycData?.frontImage || userProfile.governmentIdBase64 || kycStatus === 'verified' || kycStatus === 'pending');
  const hasAddressDoc = Boolean(kycData?.addressImage || kycStatus === 'verified');
  const hasSelfie = Boolean(kycData?.selfieImage || kycStatus === 'verified');
  const isComplianceApproved = kycStatus === 'verified';

  const steps = [
    {
      id: 1,
      title: 'Profile Registration',
      description: 'Account credentials & contact node',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Government ID',
      description: 'Passport or Drivers License photo',
      status: hasIdDoc ? 'completed' : 'pending',
    },
    {
      id: 3,
      title: 'Proof of Residence',
      description: 'Utility statement or bank document',
      status: hasAddressDoc ? 'completed' : (hasIdDoc ? 'active' : 'pending'),
    },
    {
      id: 4,
      title: 'Biometric Liveness',
      description: 'Facial selfie scan verification',
      status: hasSelfie ? 'completed' : (hasAddressDoc ? 'active' : 'pending'),
    },
    {
      id: 5,
      title: 'Compliance Sign-off',
      description: 'Executive security team clearance',
      status: isComplianceApproved ? 'completed' : (kycStatus === 'pending' ? 'in_review' : 'pending'),
    },
  ];

  // Calculate remaining steps
  const remainingCount = steps.filter(s => s.status !== 'completed').length;

  return (
    <div className="mb-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 p-6 text-slate-100 shadow-xl  relative overflow-hidden transition-all">
      {/* Decorative background glow */}
      <div 
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          kycStatus === 'verified' ? 'bg-emerald-500' : kycStatus === 'pending' ? 'bg-sky-500' : 'bg-amber-500'
        }`}
      />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${badgeColor}`}>
            {kycStatus === 'verified' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : kycStatus === 'pending' ? (
              <Clock className="w-6 h-6 text-sky-400 animate-pulse" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#0F172A]">
                Compliance Progress & Tier Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${badgeColor}`}>
                {kycStatus.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {tierLabel}
            </h3>
          </div>
        </div>

        {/* Action Button */}
        {kycStatus !== 'verified' ? (
          <Link
            to="/verification"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 group shrink-0"
          >
            <span>Complete Identity Verification</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Full Tier 2 Clearance Active</span>
          </div>
        )}
      </div>

      {/* Visual Progress Bar Section */}
      <div className="mb-6 relative z-10 bg-slate-100 p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Overall Onboarding Clearance
          </span>
          <span className="font-mono font-bold text-emerald-400">{progressPercent}% Completed</span>
        </div>
        
        <div className="w-full bg-white rounded-full h-3 p-0.5 overflow-hidden dark:bg-slate-800">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              kycStatus === 'verified' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                : kycStatus === 'pending'
                ? 'bg-gradient-to-r from-sky-500 to-emerald-400'
                : 'bg-gradient-to-r from-amber-500 to-sky-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Operational Limits Comparison */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#0F172A] block mb-0.5">Current Daily Wire Limit</span>
            <span className="font-mono font-bold text-[#1E293B]">{currentLimit}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#0F172A] block mb-0.5">Next Tier ({nextTierLabel})</span>
            <span className="font-mono font-bold text-emerald-400">{nextLimit}</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-[10px] uppercase font-mono text-[#0F172A] block mb-0.5">Remaining Steps</span>
            <span className="font-mono font-bold text-amber-400">
              {remainingCount === 0 ? '0 (All Cleared)' : `${remainingCount} Step${remainingCount > 1 ? 's' : ''} Pending`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Stepper Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isInReview = step.status === 'in_review';
          const isActive = step.status === 'active';

          return (
            <div
              key={step.id}
              className={`p-3 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500/30 text-emerald-200'
                  : isInReview
                  ? 'bg-sky-500 border-sky-500/30 text-sky-200'
                  : isActive
                  ? 'bg-amber-500 border-amber-500/30 text-amber-200'
                  : 'bg-slate-100 border-slate-200 text-[#0F172A]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                  Step {step.id}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isInReview ? (
                  <Clock className="w-4 h-4 text-sky-400 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 text-[#0F172A]" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5 truncate">{step.title}</h4>
              <p className="text-[11px] text-[#0F172A] leading-tight line-clamp-2">{step.description}</p>
            </div>
          );
        })}
      </div>

      {/* Contextual Remaining Action Banner */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#0F172A] relative z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {kycStatus === 'unverified' && 'Please upload a government photo ID and address proof to upgrade your transfer limits.'}
            {kycStatus === 'pending' && 'Your identity documents have been submitted and are currently awaiting executive clearance.'}
            {kycStatus === 'rejected' && 'One or more submitted documents required update. Please re-upload clear photo documents.'}
            {kycStatus === 'verified' && 'Your account has completed all compliance audits. All sovereign banking features are fully operational.'}
          </span>
        </div>
        {kycStatus !== 'verified' && (
          <Link
            to="/verification"
            className="text-emerald-400 hover:text-emerald-300 font-bold text-xs inline-flex items-center gap-1 shrink-0"
          >
            <span>Review Documents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
