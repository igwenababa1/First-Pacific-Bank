
import React, { useState, useMemo, useRef } from 'react';
import { 
    BriefcaseIcon, 
    SearchIcon, 
    MapPinIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    XIcon, 
    GlobeAmericasIcon, 
    ShieldCheckIcon, 
    UsersIcon, 
    TrendingUpIcon, 
    BuildingOfficeIcon, 
    PaperClipIcon, 
    SpinnerIcon, 
    PremiumReservedBankLogo, 
    LockClosedIcon 
} from './Icons';

// --- Types ---
interface JobPosition {
    id: string;
    title: string;
    department: 'Investment Banking' | 'Technology' | 'Legal & Compliance' | 'Wealth Management' | 'Operations';
    location: string;
    type: 'Full-time' | 'Contract';
    description: string;
    postedDate: string;
}

// --- Career Openings Data ---
const OPEN_POSITIONS: JobPosition[] = [
    { id: 'JOB-8821', title: 'Senior Quantitative Strategist', department: 'Investment Banking', location: 'New York, NY', type: 'Full-time', description: 'Lead algorithmic trading strategies for our high-frequency institutional desk.', postedDate: '2 days ago' },
    { id: 'JOB-9932', title: 'Principal Software Architect (Core Ledger)', department: 'Technology', location: 'Remote / London', type: 'Full-time', description: 'Architect the next generation of our immutable settlement layer using Rust and Go.', postedDate: '1 week ago' },
    { id: 'JOB-7741', title: 'Global Compliance Officer (AML/KYC)', department: 'Legal & Compliance', location: 'Singapore', type: 'Full-time', description: 'Oversee cross-border regulatory frameworks and sanctions screening protocols.', postedDate: '3 days ago' },
    { id: 'JOB-6652', title: 'Private Wealth Advisor - Ultra High Net Worth', department: 'Wealth Management', location: 'Zurich, Switzerland', type: 'Full-time', description: 'Manage portfolios for our most exclusive tier of sovereign and private clients.', postedDate: 'Just now' },
    { id: 'JOB-5519', title: 'Cybersecurity Analyst (Threat Intel)', department: 'Technology', location: 'New York, NY', type: 'Full-time', description: 'Monitor and neutralize advanced persistent threats against our global infrastructure.', postedDate: '5 days ago' },
    { id: 'JOB-4428', title: 'Head of Settlement Operations', department: 'Operations', location: 'Frankfurt, DE', type: 'Full-time', description: 'Ensure T+0 clearing accuracy for SWIFT and SEPA transactions.', postedDate: '2 weeks ago' },
];

const DEPARTMENTS = ['All Departments', 'Investment Banking', 'Technology', 'Legal & Compliance', 'Wealth Management', 'Operations'];
const LOCATIONS = ['All Locations', 'New York, NY', 'London, UK', 'Singapore', 'Zurich, Switzerland', 'Frankfurt, DE', 'Remote'];

// --- Application Modal ---
const ApplicationModal: React.FC<{ job: JobPosition; onClose: () => void }> = ({ job, onClose }) => {
    const [step, setStep] = useState<'profile' | 'resume' | 'clearance' | 'success'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleNext = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (step === 'profile') setStep('resume');
            else if (step === 'resume') setStep('clearance');
            else if (step === 'clearance') setStep('success');
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white[0.02] dark:bg-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <BriefcaseIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight leading-none">{step === 'success' ? 'Application Received' : 'Candidate Portal'}</h3>
                            <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-widest mt-1">
                                Applying for: <span className="text-[#0F172A] dark:text-white">{job.title}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-colors dark:bg-slate-800">
                        <XIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 overflow-y-auto custom-scrollbar flex-grow">
                    {step === 'profile' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">First Name</label>
                                    <input type="text" className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Enter name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Last Name</label>
                                    <input type="text" className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Enter surname" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Email Address</label>
                                <input type="email" className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="name@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">LinkedIn Profile (Secure Link)</label>
                                <input type="text" className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="https://linkedin.com/in/..." />
                            </div>
                        </div>
                    )}

                    {step === 'resume' && (
                        <div className="space-y-8 animate-fade-in-up text-center py-8">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-12 cursor-pointer transition-all group ${fileName ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 dark:border-slate-300 hover:border-primary hover:bg-white'}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${fileName ? 'bg-emerald-500 text-[#0F172A] dark:text-white' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white group-hover:bg-primary group-hover:text-[#0F172A] dark:text-white'}`}>
                                        {fileName ? <CheckCircleIcon className="w-8 h-8" /> : <PaperClipIcon className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0F172A] dark:text-white text-lg">{fileName || "Drop Resume or Click to Upload"}</p>
                                        <p className="text-xs text-[#0F172A] mt-2 uppercase tracking-widest">PDF, DOCX (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left primary- border primary- p-4 rounded-xl flex gap-3">
                                <ShieldCheckIcon className="w-5 h-5 primary- shrink-0" />
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">
                                    Your data is encrypted at rest. By uploading, you consent to our automated parsing system extracting professional credentials for matching.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'clearance' && (
                        <div className="space-y-8 animate-fade-in-up text-center py-10">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <LockClosedIcon className="w-8 h-8 text-primary animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Security Clearance Pre-Check</h4>
                                <p className="text-[#0F172A] dark:text-white text-sm mt-3 max-w-sm mx-auto">
                                    Running automated background eligibility and conflict of interest scan based on provided identity...
                                </p>
                            </div>
                            <div className="bg-slate-100 rounded-xl p-4 border border-slate-100 dark:border-white/10 text-left font-mono text-xs space-y-2 max-w-sm mx-auto">
                                <p className="text-emerald-400">✓ Identity Verified</p>
                                <p className="text-emerald-400">✓ Sanctions List: Clean</p>
                                <p className="text-emerald-400">✓ Residency Status: Eligible</p>
                                <p className="text-primary animate-pulse">... Finalizing Application Packet</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12 animate-fade-in-up">
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                                <CheckCircleIcon className="w-12 h-12 text-[#0F172A] dark:text-white" />
                            </div>
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter mb-4">Application Secured</h3>
                            <p className="text-[#0F172A] dark:text-white text-lg max-w-md mx-auto leading-relaxed">
                                Your profile has been encrypted and routed to our Talent Acquisition Node. We will initiate contact via secure email within 48 hours.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {step !== 'success' && (
                    <div className="p-8 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                         <div className="flex gap-1">
                            {['profile', 'resume', 'clearance'].map((s, i) => (
                                <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${i <= ['profile', 'resume', 'clearance'].indexOf(step) ? 'bg-primary' : 'bg-white dark:bg-slate-900'}`}></div>
                            ))}
                        </div>
                        <button 
                            onClick={handleNext} 
                            disabled={isLoading || (step === 'resume' && !fileName)}
                            className="px-8 py-4 bg-white text-[#0F172A] font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-slate-200 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-slate-800"
                        >
                            {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : null}
                            <span>{step === 'clearance' ? 'Submit Application' : 'Continue'}</span>
                            {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
                 {step === 'success' && (
                    <div className="p-8 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-center">
                        <button onClick={onClose} className="px-10 py-4 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 dark:bg-slate-700 transition-all">
                            Return to Careers
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Careers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [locFilter, setLocFilter] = useState('All Locations');
    const [applyingJob, setApplyingJob] = useState<JobPosition | null>(null);

    const filteredJobs = useMemo(() => {
        return OPEN_POSITIONS.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = deptFilter === 'All Departments' || job.department === deptFilter;
            const matchesLoc = locFilter === 'All Locations' || job.location === locFilter;
            return matchesSearch && matchesDept && matchesLoc;
        });
    }, [searchTerm, deptFilter, locFilter]);

    return (
        <div className="min-h-screen pb-20">
            {applyingJob && <ApplicationModal job={applyingJob} onClose={() => setApplyingJob(null)} />}

            {/* Hero Section */}
            <div className="relative h-[600px] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30 grayscale mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950"></div>
                </div>
                
                <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-slate-200 dark:border-white/10  mb-8 dark:bg-slate-800">
                        <PremiumReservedBankLogo className="w-5 h-5 text-[#0F172A] dark:text-white" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Premium Reserved Bank Careers</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-[#0F172A] dark:text-white tracking-tighter leading-none mb-6">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">Elite.</span>
                    </h1>
                    <p className="text-lg text-[#0F172A] dark:text-white max-w-2xl mx-auto leading-relaxed font-light">
                        We are building the financial infrastructure for the next century. Join a team of visionaries, engineers, and strategists redefining global wealth.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                {/* Values Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {[
                        { icon: GlobeAmericasIcon, title: "Global Impact", desc: "Work on systems that move billions across 190+ countries instantly." },
                        { icon: ShieldCheckIcon, title: "Uncompromising Integrity", desc: "Uphold the highest standards of security and privacy in the industry." },
                        { icon: TrendingUpIcon, title: "Limitless Growth", desc: "Accelerated career trajectories for high-performance individuals." },
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl hover:border-primary/30 transition-colors group">
                            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <item.icon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-3">{item.title}</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Job Search Engine */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
                        <div>
                            <h2 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tight">Open Positions</h2>
                            <p className="text-[#0F172A] dark:text-white mt-2 text-sm">Discover your role in the future of banking.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-emerald-500 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Hiring Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-3xl flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <SearchIcon className="w-5 h-5 text-[#0F172A] absolute left-5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Search by role or keyword..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[#0F172A] dark:text-white placeholder-slate-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative min-w-[200px]">
                                <BuildingOfficeIcon className="w-5 h-5 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select 
                                    value={deptFilter}
                                    onChange={e => setDeptFilter(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[#0F172A] dark:text-white appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer text-sm font-bold"
                                >
                                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-50 dark:bg-slate-900">{d}</option>)}
                                </select>
                            </div>
                            <div className="relative min-w-[200px]">
                                <GlobeAmericasIcon className="w-5 h-5 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select 
                                    value={locFilter}
                                    onChange={e => setLocFilter(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-10 text-[#0F172A] dark:text-white appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer text-sm font-bold"
                                >
                                    {LOCATIONS.map(l => <option key={l} value={l} className="bg-slate-50 dark:bg-slate-900">{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Listings */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => (
                                <div key={job.id} className="group bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-8 rounded-[2rem] hover:bg-slate-50 dark:bg-slate-900 hover:border-primary/30 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded border border-primary/20">{job.department}</span>
                                            <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3" /> {job.location}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white group-hover:text-primary-100 transition-colors">{job.title}</h3>
                                        <p className="text-[#0F172A] dark:text-white text-sm max-w-2xl">{job.description}</p>
                                        <p className="text-xs text-[#0F172A] pt-2">Posted {job.postedDate}</p>
                                    </div>
                                    <button 
                                        onClick={() => setApplyingJob(job)}
                                        className="px-8 py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all shadow-xl whitespace-nowrap min-w-[160px] dark:bg-slate-800"
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/10 border-dashed">
                                <UsersIcon className="w-16 h-16 text-[#0F172A] mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">No positions found</h3>
                                <p className="text-[#0F172A] mt-2">Try adjusting your filters or check back later.</p>
                                <button 
                                    onClick={() => {setSearchTerm(''); setDeptFilter('All Departments'); setLocFilter('All Locations');}}
                                    className="mt-6 text-primary text-sm font-bold hover:underline"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
