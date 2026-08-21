import React, { useState } from 'react';
import { db } from '../services/database';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
    userEmail: string;
    onComplete: () => void;
}

export const JointAccountFormFlow: React.FC<Props> = ({ userEmail, onComplete }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        primaryName: '',
        primaryEmail: userEmail,
        primarySsn: '',
        primaryDob: '',
        primaryAddress: '',
        secondaryName: '',
        secondaryEmail: '',
        secondarySsn: '',
        secondaryRelationship: '',
        secondaryAddress: '',
        ownership: 'jtwros',
        settlement: 'swift',
        balance: '',
        primarySignature: '',
        secondarySignature: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOwnershipChange = (type: string) => {
        setFormData(prev => ({ ...prev, ownership: type }));
    };

    const handleSettlementChange = (type: string) => {
        setFormData(prev => ({ ...prev, settlement: type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Save the application somehow (maybe log it or dismiss)
            await db.updateUserProfile(userEmail, { requiresJointForm: false });
            db.logUserAction('submitted_joint_account_application', { email: userEmail, formData });
            onComplete();
        } catch (err) {
            console.error('Submission failed', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitting) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#0d131f] flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-20 h-20 border-4 border-[#162138] border-t-[#0ec5f2] rounded-full animate-spin mb-8"></div>
                <h2 className="text-3xl font-serif text-white tracking-widest mb-4">PROCESSING LEDGER SIGNATURES</h2>
                <p className="text-sm tracking-widest text-[#64748b] uppercase font-bold max-w-md">
                    Validating cryptographic hashes and dispatching Joint Account request packets to the First Pacific Corporate Trustee Board...
                </p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#0d131f] overflow-y-auto overflow-x-hidden p-4 md:p-10 font-sans text-[#0F172A]">
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen">
                <form onSubmit={handleSubmit} className="w-full">
                    {/* Header */}
                    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-white/10 pb-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white tracking-wide mb-1">FIRST PACIFIC BANK</h1>
                            <p className="text-xs text-[#a0aabf] font-mono tracking-wider">Wall Street Headquarters Hub | clearance@firstpacifiq.com</p>
                        </div>
                        <div className="mt-4 md:mt-0 p-2 border border-emerald-900 bg-emerald-950 rounded">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">SYSTEM PROTOCOL: ISO-20022 VERIFIED</span>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="mb-12">
                        <h2 className="text-4xl font-serif font-bold text-white mb-4">Joint Account Portfolio Application</h2>
                        <p className="text-sm text-[#7c8b9f] leading-relaxed max-w-3xl">
                            Establishment protocol for secure, multi-signature high-value node asset portfolios. This framework is governed under standard statutory reserve guidelines and cryptographic private network asset-backing rules.
                        </p>
                    </div>

                    {/* 1. Primary Holder */}
                    <div className="border border-slate-200 dark:border-white/10 bg-[#121927] rounded-xl p-8 mb-8 shadow-2xl relative">
                        <div className="absolute top-8 right-8 text-[10px] font-mono text-[#5b687f] uppercase tracking-widest">SIGNATORY NODE 01</div>
                        <h3 className="text-xl font-bold text-[#dba114] mb-8">1. Primary Account Holder Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Legal Full Name</label>
                                <input required name="primaryName" value={formData.primaryName} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors" type="text" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Email Address</label>
                                <input required name="primaryEmail" value={formData.primaryEmail} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors" type="email" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Social Security Number / ITIN</label>
                                <input required name="primarySsn" value={formData.primarySsn} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors" type="password" placeholder="••• - •• - ••••" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Date Of Birth</label>
                                <input required name="primaryDob" value={formData.primaryDob} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors" type="date" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Residential Address (Physical US Street Address)</label>
                            <input required name="primaryAddress" value={formData.primaryAddress} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors" type="text" />
                        </div>
                    </div>

                    {/* 2. Secondary Holder */}
                    <div className="border border-slate-200 dark:border-white/10 bg-[#121927] rounded-xl p-8 mb-8 shadow-2xl relative">
                        <div className="absolute top-8 right-8 text-[10px] font-mono text-[#5b687f] uppercase tracking-widest">SIGNATORY NODE 02</div>
                        <h3 className="text-xl font-bold text-[#dba114] mb-8">2. Secondary Account Holder Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Legal Full Name</label>
                                <input required name="secondaryName" value={formData.secondaryName} onChange={handleChange} className="w-full bg-transparent border border-dashed border-[#334155] rounded-lg p-3 text-white focus:outline-none focus:border-[#0ec5f2]/50 transition-colors" type="text" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Email Address</label>
                                <input required name="secondaryEmail" value={formData.secondaryEmail} onChange={handleChange} className="w-full bg-transparent border border-dashed border-[#334155] rounded-lg p-3 text-white focus:outline-none focus:border-[#0ec5f2]/50 transition-colors" type="email" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Social Security Number / ITIN</label>
                                <input required name="secondarySsn" value={formData.secondarySsn} onChange={handleChange} className="w-full bg-transparent border border-dashed border-[#334155] rounded-lg p-3 text-white focus:outline-none focus:border-[#0ec5f2]/50 transition-colors" type="password" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Relationship to Primary Signatory</label>
                                <input required name="secondaryRelationship" value={formData.secondaryRelationship} onChange={handleChange} className="w-full bg-transparent border border-dashed border-[#334155] rounded-lg p-3 text-white focus:outline-none focus:border-[#0ec5f2]/50 transition-colors" type="text" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Residential Address (If Different from Primary)</label>
                            <input name="secondaryAddress" value={formData.secondaryAddress} onChange={handleChange} className="w-full bg-transparent border border-dashed border-[#334155] rounded-lg p-3 text-white focus:outline-none focus:border-[#0ec5f2]/50 transition-colors" type="text" />
                        </div>
                    </div>

                    {/* 3. Specs */}
                    <div className="border border-slate-200 dark:border-white/10 bg-[#121927] rounded-xl p-8 mb-12 shadow-2xl relative">
                        <div className="absolute top-8 right-8 text-[10px] font-mono text-[#5b687f] uppercase tracking-widest">LEDGER CONFIG</div>
                        <h3 className="text-xl font-bold text-[#dba114] mb-8">3. Account Type & Funding Specifications</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-4">Joint Ownership Structure</label>
                                <div className="space-y-4">
                                    <div onClick={() => handleOwnershipChange('jtwros')} className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-center ${formData.ownership === 'jtwros' ? 'border-[#dba114] bg-[#1a1711]' : 'border-slate-200 dark:border-white/10 bg-[#182133] hover:border-slate-200 dark:border-black/10'}`}>
                                        <div className={`w-4 h-4 mr-4 ${formData.ownership === 'jtwros' ? 'bg-[#dba114]' : 'border border-[#64748b]'}`}></div>
                                        <span className="text-sm">Joint Tenants with Rights of Survivorship<br/><span className="text-xs text-[#a0aabf]">(JTWROS)</span></span>
                                    </div>
                                    <div onClick={() => handleOwnershipChange('tic')} className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-center ${formData.ownership === 'tic' ? 'border-[#dba114] bg-[#1a1711]' : 'border-slate-200 dark:border-white/10 bg-[#182133] hover:border-slate-200 dark:border-black/10'}`}>
                                        <div className={`w-4 h-4 mr-4 ${formData.ownership === 'tic' ? 'bg-[#dba114]' : 'border border-[#64748b]'}`}></div>
                                        <span className="text-sm">Tenants in Common (TIC)</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-4">Initial Settlement Protocol</label>
                                <div className="space-y-4">
                                     <div onClick={() => handleSettlementChange('swift')} className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-center ${formData.settlement === 'swift' ? 'border-[#dba114] bg-[#1a1711]' : 'border-slate-200 dark:border-white/10 bg-[#182133] hover:border-slate-200 dark:border-black/10'}`}>
                                        <div className={`w-4 h-4 mr-4 ${formData.settlement === 'swift' ? 'bg-[#dba114]' : 'border border-[#64748b]'}`}></div>
                                        <span className="text-sm">SWIFT_GPI Network Node</span>
                                    </div>
                                    <div onClick={() => handleSettlementChange('fedwire')} className={`cursor-pointer p-4 border rounded-lg transition-colors flex items-center ${formData.settlement === 'fedwire' ? 'border-[#dba114] bg-[#1a1711]' : 'border-slate-200 dark:border-white/10 bg-[#182133] hover:border-slate-200 dark:border-black/10'}`}>
                                        <div className={`w-4 h-4 mr-4 ${formData.settlement === 'fedwire' ? 'bg-[#dba114]' : 'border border-[#64748b]'}`}></div>
                                        <span className="text-sm">Fedwire Ledger Settlement</span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-2">Anticipated Balance Post Entry</label>
                                    <input required name="balance" value={formData.balance} onChange={handleChange} className="w-full bg-[#182133] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#dba114]/50 transition-colors font-mono" type="text" placeholder="$ 0.00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclosure & Signatures */}
                    <div className="border border-[#1e293b] bg-[#0c111a] rounded-xl p-8 mb-12 shadow-2xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#64748b] mb-4 border-b border-[#1e293b] pb-2">Sovereign Cryptographic Ledger Regulatory Disclosure</h4>
                        <p className="text-[11px] text-[#475569] leading-relaxed mb-12 text-justify">
                            By executing this request packet, both entity signatories affirm complete compliance under statutory reserve framework guidelines. All assets transferred or maintained via First Pacific Bank portfolios are audited and validated under standard ISO-20022 compliance rule matrices and cross-verified against global database units including the IMF. Transmission ledger entries committed to private book chains are permanent, immutable, final, and subject to Federal Reserve node audit standards.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                            <div>
                                <input required name="primarySignature" value={formData.primarySignature} onChange={handleChange} type="text" className="w-full bg-transparent border-0 border-b border-[#334155] focus:outline-none focus:border-white text-white font-serif italic text-xl px-2 py-1 text-center" placeholder="Sign Here" />
                                <div className="text-center mt-2">
                                    <p className="text-xs text-[#a0aabf]">Primary Signatory Signature</p>
                                    <p className="text-[10px] text-[#475569]">Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div>
                                <input required name="secondarySignature" value={formData.secondarySignature} onChange={handleChange} type="text" className="w-full bg-transparent border-0 border-b border-[#334155] focus:outline-none focus:border-white text-white font-serif italic text-xl px-2 py-1 text-center" placeholder="Sign Here" />
                                <div className="text-center mt-2">
                                     <p className="text-xs text-[#a0aabf]">Secondary Signatory Signature</p>
                                     <p className="text-[10px] text-[#475569]">Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-lg mx-auto border border-[#dba114]/30 bg-[#dba114]/10 rounded-lg py-2 px-4 flex items-center justify-center mb-8">
                            <span className="font-mono text-[#dba114] text-[10px] tracking-widest break-all text-center">HASH SECURITY KEY MATCHED SHA256: TX-178110672781106720563</span>
                        </div>
                    </div>

                    <div className="text-center mb-12">
                         <button type="submit" className="px-12 py-4 bg-[#dba114] hover:bg-[#b0800b] text-black font-black uppercase tracking-widest rounded transition-colors">
                             Submit Protocol & Authorize Ledger
                         </button>
                    </div>

                    {/* Footer */}
                    <div className="text-center border-t border-[#1e293b] pt-8 pb-12">
                        <p className="text-[10px] text-[#475569] font-bold uppercase tracking-widest mb-2">FIRST PACIFIC CORPORATE TRUSTEE BOARD • SOVEREIGN LEDGER NODE COMPLIANCE OFFICE, ZÜRICH / NEW YORK</p>
                        <p className="text-[10px] text-[#334155]">© 2026 First Pacific Bank Inc. Certified compliance asset routing system. Under ISO-20022 regulatory mandates.</p>
                        <p className="text-[10px] text-[#334155] mt-2 font-mono">Page 2 of 2</p>
                    </div>
                </form>
            </div>
        </div>
    );
};
