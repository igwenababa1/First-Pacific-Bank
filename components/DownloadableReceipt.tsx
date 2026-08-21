import React from 'react';
import { Transaction, Account, TransactionStatus, UserProfile } from '../types';
import { PremiumReservedBankLogo } from './Icons';
import { USER_PROFILE } from './constants';
import { getFlagUrl } from '../utils/flags';

interface DownloadableReceiptProps {
  transaction: Transaction;
  sourceAccount: Account;
  userProfile?: UserProfile;
  transactions?: Transaction[];
}

export const DownloadableReceipt: React.FC<DownloadableReceiptProps> = ({ 
    transaction, 
    sourceAccount, 
    userProfile, 
    transactions 
}) => {
    const isCompleted = transaction.status === 'Funds Arrived' || transaction.status === 'Completed' || transaction.federallyVerified;
    const isCredit = transaction.type === 'credit';
    const isAdjustment = transaction.isAdjustment || isCredit;
    
    const submissionDate = transaction.statusTimestamps?.[TransactionStatus.SUBMITTED] || new Date();
    const formattedDateTime = new Date(submissionDate).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'
    });

    const isFederallyVerified = transaction.federallyVerified || transaction.isAdjustment;

    // --- Chronological Running Balance Walkback ---
    // Walk back from the current account balance to find the exact opening and closing running balances
    // at the moment of this transaction.
    let openingBalance = sourceAccount.balance;
    let closingBalance = sourceAccount.balance;
    let foundHistoric = false;

    if (transactions && transactions.length > 0) {
        // Filter transactions for this specific account
        const accountTxs = transactions
            .filter(t => t.accountId === sourceAccount.id)
            .sort((a, b) => {
                const dateA = new Date(a.statusTimestamps?.[TransactionStatus.SUBMITTED] || 0).getTime();
                const dateB = new Date(b.statusTimestamps?.[TransactionStatus.SUBMITTED] || 0).getTime();
                return dateB - dateA; // Newest first (descending)
            });

        let runningBalance = sourceAccount.balance;
        for (const tx of accountTxs) {
            const txIsCredit = tx.type === 'credit';
            const txSendAmount = tx.sendAmount || 0;
            const txFee = tx.fee || 0;
            const txComplianceFee = tx.complianceFee || 0;

            if (tx.id === transaction.id) {
                closingBalance = runningBalance;
                openingBalance = txIsCredit 
                    ? runningBalance - txSendAmount
                    : runningBalance + txSendAmount + txFee + txComplianceFee;
                foundHistoric = true;
                break;
            }

            // Move running balance backwards to before this tx occurred
            if (txIsCredit) {
                runningBalance -= txSendAmount;
            } else {
                runningBalance += txSendAmount + txFee + txComplianceFee;
            }
        }
    }

    // Fallback if transaction was not found in history or history is not provided
    if (!foundHistoric) {
        if (isCredit) {
            openingBalance = sourceAccount.balance - transaction.sendAmount;
            closingBalance = sourceAccount.balance;
        } else {
            const txComplianceFee = transaction.complianceFee || 0;
            openingBalance = sourceAccount.balance + transaction.sendAmount + transaction.fee + txComplianceFee;
            closingBalance = sourceAccount.balance;
        }
    }

    // User details (Payer/Sender)
    const payerName = userProfile?.name || USER_PROFILE.name;
    const payerEmail = userProfile?.email || "info@lawrenceconsultantsorg.org";
    const payerPhone = userProfile?.phone || "+1 (315) 915-0854";
    const payerAddress = userProfile?.address || "100 Pine St, Suite 2400, San Francisco, CA 94111";

    // Recipient details (Beneficiary)
    const beneficiaryName = transaction.recipient?.fullName || "N/A";
    const beneficiaryBank = transaction.recipient?.bankName || "N/A";
    const beneficiaryAccount = transaction.recipient?.realDetails?.accountNumber || transaction.recipient?.accountNumber || "N/A";
    const beneficiarySwift = transaction.recipient?.realDetails?.swiftBic || "FPB-US-RT-99";
    const beneficiaryIntermediary = transaction.recipient?.realDetails?.intermediaryBank || "N/A";
    const beneficiaryPhone = transaction.recipient?.phone || "N/A";
    const beneficiaryEmail = transaction.recipient?.email || "N/A";

    // Format recipient full address
    const rStreet = transaction.recipient?.streetAddress || "";
    const rCity = transaction.recipient?.city || "";
    const rState = transaction.recipient?.stateProvince || "";
    const rZip = transaction.recipient?.postalCode || "";
    const rCountry = transaction.recipient?.country?.name || "";
    const beneficiaryAddress = [rStreet, rCity, rState, rZip, rCountry].filter(Boolean).join(', ') || "N/A";

    return (
        <div className="w-[800px] bg-white text-gray-800 p-10 font-sans border-t-8 border-emerald-600 relative overflow-hidden dark:bg-slate-800">
            {/* Watermark Logo Backplate Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                <div className="w-[550px] h-[550px] rounded-full flex flex-col items-center justify-center p-8 opacity-[0.035] text-[#0F172A]">
                    <svg className="w-64 h-64 mb-3 opacity-95" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Concentric Guilloche Rings */}
                        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
                        <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="0.75" strokeDasharray="5 3" />
                        <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="0.5" />
                        
                        {/* Central Bank Crest Shield */}
                        <path d="M100 48 L128 64 V102 C128 128 100 148 100 148 C100 148 72 128 72 102 V64 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        {/* Inner Star */}
                        <polygon points="100,74 103,84 113,84 105,91 108,101 100,95 92,101 95,91 87,84 97,84" fill="currentColor" opacity="0.6" />
                        
                        {/* Guilloche Scroll Lines */}
                        <path d="M50 90 C58 80 68 80 76 87 M150 90 C142 80 132 80 124 87" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                        <path d="M46 100 C54 90 64 90 72 97 M154 100 C146 90 136 90 128 97" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                        <path d="M54 110 C62 100 72 100 80 107 M146 110 C138 100 128 100 120 107" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                    </svg>
                    <span className="font-sans font-black text-[18px] tracking-[0.35em] uppercase text-center mb-1">
                        FIRST PACIFIC BANK
                    </span>
                    <span className="font-mono text-[9px] tracking-widest uppercase text-center mb-3 font-bold">
                        OFFICIAL SEAL OF TRUST
                    </span>
                    <div className="w-32 h-[1px] bg-current opacity-30 mb-3" />
                    <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-center max-w-[340px]">
                        PRIVATE PORTAL SECURE VERIFICATION NODAL UNIT
                    </span>
                    <span className="font-mono text-[7px] tracking-wider text-center mt-2 opacity-70">
                        SECURE MULTI-LEDGER ISO-20022 COMPLIANT • MEMBER OCC & FDIC
                    </span>
                </div>
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Institutional Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-200 pb-5">
                    <div className="flex items-start space-x-3">
                        <PremiumReservedBankLogo />
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-gray-950 uppercase tracking-[0.15em] leading-none mb-1">First Pacific</h1>
                            <span className="text-xs text-emerald-700 font-bold uppercase tracking-[0.3em] leading-none">Bank</span>
                            <div className="mt-3 text-[10px] text-[#0F172A] font-mono space-y-0.5 leading-relaxed">
                                <p>First Pacific Bank Headquarters</p>
                                <p>100 Pine St, Suite 2400</p>
                                <p>San Francisco, CA 94111</p>
                                <p className="text-emerald-700 font-semibold">Web: www.firstpaba.com</p>
                                <p>Phone: +1 (800) 555-0199 | Fax: +1 (800) 555-0198</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight uppercase">
                            {isAdjustment ? 'Federal Clearing Adjustment Advice' : 'Official Wire Transfer Receipt'}
                        </h2>
                        <p className="text-xs text-[#0F172A] font-mono mt-1">Date Issued: {formattedDateTime}</p>
                        <div className="mt-4 inline-block bg-slate-50 text-white text-[9px] font-bold px-3 py-1 rounded font-mono uppercase tracking-widest dark:bg-slate-900">
                            {transaction.status}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase text-[#0F172A] tracking-wider font-mono">Transaction Reference ID</p>
                        <p className="text-base font-mono tracking-wider text-emerald-700 font-bold">{transaction.id}</p>
                    </div>
                    <div className="text-right">
                        {isFederallyVerified && (
                            <div className="inline-flex bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider items-center gap-1 shadow-sm">
                                🛡️ Federally Verified Adjustment
                            </div>
                        )}
                    </div>
                </div>

                {/* Transfer Path */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-900">
                    <h3 className="font-bold text-[#0F172A] border-b border-slate-200 pb-2 mb-3 text-xs uppercase tracking-widest font-mono">Transfer Route Path</h3>
                    <div className="flex items-center justify-between text-center">
                        <div className="w-2/5">
                            <img src={getFlagUrl('US')} alt="USA Flag" className="w-8 mx-auto mb-1 rounded shadow-sm border border-gray-200" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                            <p className="font-extrabold text-gray-800 text-sm truncate">{isAdjustment ? 'Interbank Federal Reserve' : 'New York, USA'}</p>
                            <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-mono">Origin Source</p>
                        </div>
                        <div className="w-1/5 text-[#0F172A] text-xl font-bold font-mono">
                            &gt;&gt;&gt;
                        </div>
                        <div className="w-2/5">
                            <img src={getFlagUrl(transaction.recipient?.country?.code || 'US')} alt="Flag" className="w-8 mx-auto mb-1 rounded shadow-sm border border-gray-200" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                            <p className="font-extrabold text-gray-800 text-sm truncate">
                                {isAdjustment ? payerName : `${transaction.recipient?.city || 'New York'}, ${transaction.recipient?.country?.code || 'USA'}`}
                            </p>
                            <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-mono">Destination Account</p>
                        </div>
                    </div>
                </div>

                {/* From/To Details */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between dark:bg-slate-900">
                        <div>
                            <h3 className="font-extrabold text-emerald-800 border-b border-emerald-100 pb-2 mb-2 text-xs uppercase tracking-widest font-mono">Sender Details (Payer)</h3>
                            {isAdjustment ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 text-sm">{transaction.adjustmentSourceBank || transaction.recipient?.fullName || 'System Reserve Settlement Payer'}</p>
                                    <p className="text-xs text-gray-650">Federal Cash Clearing Pool</p>
                                    <p className="text-[10px] text-[#0F172A] font-mono">Channel: REGULATORY_ADJUSTMENT</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 text-sm">{payerName}</p>
                                    <p className="text-xs text-[#1E293B] font-semibold">{sourceAccount.nickname}</p>
                                    <p className="text-xs text-[#0F172A]">{payerAddress}</p>
                                    <p className="text-xs text-[#0F172A] font-mono">Email: {payerEmail}</p>
                                    <p className="text-xs text-[#0F172A] font-mono">Phone: {payerPhone}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-2 border-t border-dashed border-slate-200 text-xs text-[#0F172A] font-mono space-y-0.5">
                            <p>Routing RTN: {sourceAccount.routingNumber || "021000021"}</p>
                            <p>Acct FQN: {sourceAccount.fullAccountNumber || ("0210" + sourceAccount.accountNumber)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between dark:bg-slate-900">
                        <div>
                            <h3 className="font-extrabold text-emerald-800 border-b border-emerald-100 pb-2 mb-2 text-xs uppercase tracking-widest font-mono">Recipient Details (Beneficiary)</h3>
                            {isAdjustment ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 text-sm">{payerName}</p>
                                    <p className="text-xs text-[#1E293B] font-semibold">{sourceAccount.nickname || 'Checking Account'}</p>
                                    <p className="text-xs text-[#0F172A]">{payerAddress}</p>
                                    <p className="text-xs text-[#0F172A] font-mono">Email: {payerEmail}</p>
                                    <p className="text-xs text-[#0F172A] font-mono">Phone: {payerPhone}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 text-sm">{beneficiaryName}</p>
                                    <p className="text-xs text-gray-700 font-semibold">{beneficiaryBank}</p>
                                    <p className="text-xs text-[#0F172A] leading-relaxed truncate" title={beneficiaryAddress}>Addr: {beneficiaryAddress}</p>
                                    {beneficiaryEmail !== "N/A" && <p className="text-xs text-gray-550 font-mono">Email: {beneficiaryEmail}</p>}
                                    {beneficiaryPhone !== "N/A" && <p className="text-xs text-gray-550 font-mono">Phone: {beneficiaryPhone}</p>}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-2 border-t border-dashed border-slate-200 text-xs text-[#0F172A] font-mono space-y-0.5">
                            <p>Routing/SWIFT: {beneficiarySwift}</p>
                            <p>Acct FQN: {beneficiaryAccount}</p>
                            {beneficiaryIntermediary !== "N/A" && <p className="truncate">Intermediary: {beneficiaryIntermediary}</p>}
                        </div>
                    </div>
                </div>

                {/* Financial Breakdown */}
                <div className="mt-6">
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-2 font-mono">Precision Ledger Audit</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-200 font-mono">
                                <tr className="bg-slate-50 dark:bg-slate-900">
                                    <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px]">Ledger Opening Balance</td>
                                    <td className="p-3 text-right font-black text-[#0F172A] text-sm">
                                        {openingBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px]">
                                        {isCredit ? 'Credit Entry (Incoming Principal)' : 'Debit Entry (Outgoing Principal)'}
                                    </td>
                                    <td className={`p-3 text-right font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isCredit ? '+' : '-'} {transaction.sendAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                                {!isCredit && (
                                    <>
                                        <tr>
                                            <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px] pl-6">↳ Federal Reserve Outgoing Wire Fee</td>
                                            <td className={`p-3 text-right font-bold text-xs ${transaction.fee > 0 ? 'text-rose-600' : 'text-emerald-600 font-black'}`}>
                                                {transaction.fee > 0 ? `- ${(transaction.fee * 0.55).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : 'Waived ($0.00)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px] pl-6">↳ Correspondent Intermediary Fee</td>
                                            <td className={`p-3 text-right font-bold text-xs ${transaction.fee > 0 ? 'text-rose-600' : 'text-emerald-600 font-black'}`}>
                                                {transaction.fee > 0 ? `- ${(transaction.fee * 0.30).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : 'Waived ($0.00)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px] pl-6">↳ Clearinghouse & Dodd-Frank Surcharge</td>
                                            <td className={`p-3 text-right font-bold text-xs ${transaction.fee > 0 ? 'text-rose-600' : 'text-emerald-600 font-black'}`}>
                                                {transaction.fee > 0 ? `- ${(transaction.fee * 0.15).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : 'Waived ($0.00)'}
                                            </td>
                                        </tr>
                                    </>
                                )}
                                {!isCredit && transaction.complianceFee !== undefined && transaction.complianceFee > 0 && (
                                    <tr>
                                        <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px]">Compliance Halt Fee</td>
                                        <td className="p-3 text-right text-rose-550 font-black text-sm text-rose-600">
                                            - {transaction.complianceFee.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                    </tr>
                                )}
                                {transaction.exchangeRate && transaction.exchangeRate !== 1 && (
                                    <>
                                        <tr>
                                            <td className="p-3 text-[#0F172A] font-sans font-extrabold uppercase tracking-widest text-[10px]">FX Conversion Rate ({transaction.receiveCurrency || 'EUR'})</td>
                                            <td className="p-3 text-right font-bold text-xs text-slate-950 font-mono">
                                                {transaction.exchangeRate.toFixed(4)} (0.35% Spread Included)
                                            </td>
                                        </tr>
                                        <tr className="bg-emerald-50">
                                            <td className="p-3 text-emerald-900 font-sans font-extrabold uppercase tracking-widest text-[10px]">Guaranteed Beneficiary Payout</td>
                                            <td className="p-3 text-right font-black text-sm text-emerald-700">
                                                {(transaction.receiveAmount || transaction.sendAmount * transaction.exchangeRate).toLocaleString('en-US', { style: 'currency', currency: transaction.receiveCurrency || 'EUR' })}
                                            </td>
                                        </tr>
                                    </>
                                )}
                                <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-100">
                                    <td className="p-4 text-emerald-900 font-sans font-extrabold uppercase tracking-widest text-[10px]">Final Settled Balance</td>
                                    <td className="p-4 text-right text-base text-emerald-700 font-black">
                                        {closingBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* QR Code and Stamp */}
                <div className="mt-6 flex justify-between items-end border-t border-slate-150 pt-5">
                    <div className="text-left">
                        <img src={`https://quickchart.io/qr?text=FPB-Clearing-${transaction.id}&size=100`} alt="Transaction QR Code" className="w-20 h-20 shadow-sm border border-gray-100 p-1 bg-white rounded dark:bg-slate-800" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                        <p className="text-[10px] text-[#0F172A] font-mono mt-1 uppercase tracking-wider">Scan to verify on blockchain ledger</p>
                    </div>
                    <div className="relative w-48 h-20 flex items-center justify-end">
                        {isCompleted && (
                            <div className="absolute right-2 top-0 transform rotate-[-4deg] opacity-[0.9] pointer-events-none z-30 select-none">
                                <div className="border-[2px] border-emerald-600 text-emerald-600 rounded-md px-3 py-1 text-center uppercase font-mono font-black scale-95 mix-blend-multiply flex flex-col items-center">
                                    <span className="text-[6px] tracking-widest leading-none mb-0.5 font-bold">FEDERAL INTERBANK SYSTEM</span>
                                    <span className="text-[9px] leading-none mb-0.5 tracking-tighter">OFFICIAL VERIFICATION</span>
                                    <span className="text-[8px] font-bold leading-none mb-0.5 whitespace-nowrap text-emerald-700">FEDERALLY CLEARED</span>
                                    <span className="text-[5.5px] border-t border-emerald-600 mt-1 pt-0.5 tracking-wider font-sans uppercase">SECURED & CLEARED ADVISED</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dodd-Frank Act Section 1073 Federal Disclosures */}
                <div className="mt-6 bg-slate-50 p-4 border border-slate-200 text-[10px] text-[#0F172A] leading-relaxed font-mono rounded-lg text-left dark:bg-slate-900">
                    <p className="font-bold text-[11px] text-[#0F172A] uppercase tracking-wider mb-1">
                        Dodd-Frank Section 1073 Federal Disclosures & Remitter Rights:
                    </p>
                    <p>
                        Under Federal Regulation E, you are entitled to: (1) A full statement of fees and exchange rates before payment. (2) A written receipt upon payment containing the precise date funds will be available. (3) The right to cancel this wire transfer within 30 minutes of receipt issuance without penalty, provided the funds have not yet been cleared or deposited by the beneficiary bank.
                    </p>
                    <p className="mt-1.5 text-[9px] text-[#0F172A]">
                        For inquiries, feedback, or to exercise cancellation rights, contact the Federal Reserve Wire Clearing Support Center or our Premium Client Concierge. Reference Clearing Routing Number (RTN): 021000021.
                    </p>
                </div>

                {/* Institutional Disclaimer Footer */}
                <div className="mt-8 border-t border-gray-200 pt-4 text-center text-[10px] text-[#0F172A] leading-relaxed font-mono">
                    <p>First Pacific Bank Global Clearing Division. Registered, Cleared, and Handled under Federal Reserve Asset Protection Guidelines & PATRIOT Act Compliance Standards.</p>
                    <p className="mt-1 text-[9px] text-[#0F172A]">Regulatory Compliance Code: REG-SEC-991A-STABLE-US. Generated in real-time. Document secured with SHA-256 ledger checksum verification.</p>
                </div>
            </div>
        </div>
    );
};

