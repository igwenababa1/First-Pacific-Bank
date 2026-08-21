import React, { useState } from 'react';
import { UserProfile } from '../types';
import { UserRecord } from '../services/database';
import { AdminCommunicationsTab } from './AdminCommunicationsTab';

interface AdminSecurityPanelProps {
    user: UserRecord;
    allUsers: UserRecord[];
    onToggleBan: (user: UserRecord) => void;
    onToggleSuspension: (user: UserRecord) => void;
    onToggleRequireApproval: (user: UserRecord) => void;
    onToggleAwaitingPaymentVerification?: (user: UserRecord) => void;
    onToggleMfa: (user: UserRecord) => void;
    onAddWarning: (email: string, text: string) => void;
    onRemoveWarning: (email: string, index: number) => void;
    onSendIttcWarning: () => void;
    onAdjustBalance: () => void;
    onDeleteUser: (user: UserRecord) => void;
    onInitiateChat: (user: UserRecord) => void;
    onTogglePaymentMethod?: (method: string) => void;
}

export const AdminSecurityPanel: React.FC<AdminSecurityPanelProps> = ({
    user,
    allUsers,
    onToggleBan,
    onToggleSuspension,
    onToggleRequireApproval,
    onToggleAwaitingPaymentVerification,
    onToggleMfa,
    onAddWarning,
    onRemoveWarning,
    onSendIttcWarning,
    onAdjustBalance,
    onDeleteUser,
    onInitiateChat,
    onTogglePaymentMethod
}) => {
    const [draftWarning, setDraftWarning] = useState('');

    const profile = user.profile;
    const isBanned = !!profile.isBanned;
    const isSuspended = !!profile.isSuspended;
    const requireApproval = !!profile.requireAdminApprovalForPayments;
    const awaitingPaymentVerification = !!profile.awaitingPaymentVerificationEnabled;
    const isMfaEnabled = profile.securitySettings?.mfa?.enabled ?? true;
    const warnings = profile.warnings || [];
    const disabledPayments = profile.disabledPaymentMethods || [];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/10">
                <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Admin Security Panel</h3>
                    <p className="text-[10px] text-[#0F172A] font-mono">Sovereign administrative controls</p>
                </div>
                <span className="text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-mono px-2 py-0.5 rounded uppercase">Level 1 Clearance</span>
            </div>

            {/* Protocol Selection (Payment Flows) */}
            <div className="border-b border-slate-100 dark:border-white/10 pb-4 space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Protocol Selection Payment Flows</h4>
                    <span className="text-[9px] font-mono text-cyan-500 uppercase">User Overrides</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {['wire', 'ach', 'crypto', 'p2p'].map((rail) => {
                        const isEnabled = !disabledPayments.includes(rail);
                        return (
                            <button
                                key={rail}
                                onClick={() => onTogglePaymentMethod && onTogglePaymentMethod(rail)}
                                className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${
                                    isEnabled
                                        ? "bg-emerald-500 hover:bg-emerald-500 text-emerald-500 border-emerald-500/20"
                                        : "bg-rose-500 hover:bg-rose-500 text-rose-500 border-rose-500/20"
                                }`}
                            >
                                {rail} {isEnabled ? '✓' : '✗'}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Account Isolation Control Switches */}
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Banned Toggle */}
                    <button 
                        type="button"
                        onClick={() => onToggleBan(user)}
                        className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                            isBanned
                                ? "bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500 hover:bg-rose-500 text-rose-500 border-rose-500/20"
                        }`}
                        id="btn-admin-toggle-ban"
                    >
                        {isBanned ? "🔓 Reactivate / Unban Account" : "🚫 Ban / Disable User Profile"}
                    </button>

                    {/* Suspension Toggle */}
                    <button 
                        type="button"
                        onClick={() => onToggleSuspension(user)}
                        className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                            isSuspended
                                ? "bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500 hover:bg-amber-500 text-amber-500 border-amber-500/20"
                        }`}
                        id="btn-admin-toggle-suspension"
                    >
                        {isSuspended ? "🔓 Lift Account Suspension" : "🔒 Suspend Outgoing Capital"}
                    </button>
                </div>

                {/* Secure Pre-approval Trigger */}
                <button 
                    type="button"
                    onClick={() => onToggleRequireApproval(user)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                        requireApproval
                            ? "bg-amber-500 pointer-events-auto text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-850 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10"
                    }`}
                    id="btn-admin-toggle-min-auth"
                >
                    👮 {requireApproval 
                        ? "Require Admin Approval: ACTIVE (Payments Blocked)" 
                        : "Enable Mandatory Admin Approval for Outgoing Payments"}
                </button>

                {/* Awaiting Payment Verification Toggle */}
                <button 
                    type="button"
                    onClick={() => onToggleAwaitingPaymentVerification && onToggleAwaitingPaymentVerification(user)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                        awaitingPaymentVerification
                            ? "bg-amber-500 pointer-events-auto text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-850 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10"
                    }`}
                    id="btn-admin-toggle-payment-verification"
                >
                    🛡️ {awaitingPaymentVerification 
                        ? "Awaiting Payment Verification: ENABLED (Transactions Held)" 
                        : "Enable Awaiting Payment Verification for Transactions"}
                </button>

                {/* MFA Pre-approval Trigger */}
                <button 
                    type="button"
                    onClick={() => onToggleMfa(user)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                        isMfaEnabled
                            ? "bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500 hover:bg-rose-500 text-rose-500 border-rose-500/20"
                    }`}
                    id="btn-admin-toggle-mfa"
                >
                    🔐 {isMfaEnabled 
                        ? "Dynamic OTP (MFA): ENABLED (Click to Disable)" 
                        : "Dynamic OTP (MFA): DISABLED (Click to Enable)"}
                </button>
            </div>

            {/* Warnings Log Manager */}
            <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-4 text-left">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Compliance Warnings ({warnings.length})</h4>
                    <span className="text-[9px] font-mono text-amber-500 uppercase">Alert flags</span>
                </div>

                {/* Warnings List */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {warnings.length === 0 ? (
                        <p className="text-[10px] font-mono text-[#0F172A] italic">No record flags issued on this profile.</p>
                      ) : (
                        warnings.map((warn: string, wIdx: number) => (
                            <div key={wIdx} className="bg-slate-50 dark:bg-slate-900 border border-amber-500/10 p-2.5 rounded-lg flex justify-between items-start gap-4 animate-fade-in" id={`warn-item-${wIdx}`}>
                                <div className="flex gap-2">
                                    <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
                                    <p className="text-[11px] text-[#0F172A] dark:text-white font-mono break-all leading-relaxed">{warn}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => onRemoveWarning(user.email, wIdx)}
                                    className="text-[9px] text-rose-400 font-bold hover:text-rose-300 hover:underline cursor-pointer uppercase shrink-0"
                                    id={`warn-dismiss-${wIdx}`}
                                >
                                    Dismiss
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Issue Warning Input */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Type compliance warning bulletin details..." 
                        className="flex-1 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#0F172A] dark:text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        value={draftWarning}
                        onChange={e => setDraftWarning(e.target.value)}
                        id="input-compliance-warning"
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            if (draftWarning.trim()) {
                                onAddWarning(user.email, draftWarning);
                                setDraftWarning('');
                            }
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] px-3 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center justify-center"
                        id="btn-compliance-warning-issue"
                    >
                        Issue
                    </button>
                </div>
            </div>

            {/* Ledger Actions */}
            <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Ledger Actions & Security Overrides</h4>
                    <span className="text-[9px] font-mono text-rose-500 uppercase">Critical</span>
                </div>
                <div className="space-y-2">
                    <button 
                        type="button"
                        onClick={onSendIttcWarning}
                        className="w-full bg-red-600 hover:bg-red-600 text-red-500 border border-red-500/15 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                        id="btn-ittc-final-warning"
                    >
                        Broadcast Final ITCC Security Alarm
                    </button>
                    <button 
                        type="button"
                        onClick={onAdjustBalance}
                        className="w-full bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border border-emerald-500/15 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                        id="btn-security-adjust-balance"
                    >
                        Adjust Primary Ledger Balance
                    </button>
                    <button 
                        type="button"
                        onClick={() => onInitiateChat(user)}
                        className="w-full bg-cyan-600 hover:bg-cyan-600 text-cyan-400 border border-cyan-500/15 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Initiate Secure Live Chat Session
                    </button>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                    <button 
                        type="button"
                        onClick={() => onDeleteUser(user)}
                        className="w-full bg-red-800 hover:bg-red-800 text-red-400 border border-red-500/30 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                        id="btn-admin-permanent-delete"
                    >
                        💀 PERMANENTLY DELETE ACCOUNT
                    </button>
                </div>
            </div>

            {/* Advanced Communications Hub */}
            <div className="border-t border-slate-100 dark:border-white/10 pt-6">
                <AdminCommunicationsTab allUsers={allUsers} initialUserId={user.id} />
            </div>
        </div>
    );
};
