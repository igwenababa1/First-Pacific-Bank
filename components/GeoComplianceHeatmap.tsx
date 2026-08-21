import React, { useState, useMemo } from 'react';
import { 
    GlobeAmericasIcon, 
    ShieldCheckIcon, 
    ExclamationTriangleIcon, 
    CheckCircleIcon,
    SearchIcon as MagnifyingGlassIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon as ShieldExclamationIcon,
    LockClosedIcon
} from './Icons';
import { Transaction, TransactionStatus } from '../types';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface GeoComplianceHeatmapProps {
    transactions?: Transaction[];
    onUpdateTransaction?: (txId: string, updates: Partial<Transaction>) => Promise<void> | void;
    addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

interface RegionData {
    id: string;
    name: string;
    code: string;
    flag: string;
    fatfCategory: 'FATF Compliant' | 'Monitored Jurisdiction' | 'High-Risk Jurisdiction' | 'Sanctioned Region';
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    totalVolume: number;
    txCount: number;
    flaggedAccountsCount: number;
    eddEnforced: boolean;
    autoFlagInbound: boolean;
    topCities: string[];
}

export const GeoComplianceHeatmap: React.FC<GeoComplianceHeatmapProps> = ({ 
    transactions = [], 
    onUpdateTransaction,
    addToast 
}) => {
    const [selectedRegionId, setSelectedRegionId] = useState<string>('us_ca');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRiskLevel, setFilterRiskLevel] = useState<string>('ALL');

    // Default Geo-Compliance Regional Jurisdictions Data
    const [regions, setRegions] = useState<RegionData[]>([
        {
            id: 'us_ca',
            name: 'North America (US & Canada)',
            code: 'US-CA',
            flag: '🇺🇸',
            fatfCategory: 'FATF Compliant',
            riskScore: 12,
            riskLevel: 'LOW',
            totalVolume: 14250000,
            txCount: 1840,
            flaggedAccountsCount: 2,
            eddEnforced: false,
            autoFlagInbound: false,
            topCities: ['New York', 'Toronto', 'Chicago', 'San Francisco']
        },
        {
            id: 'eu_ch',
            name: 'Western Europe & Switzerland',
            code: 'EU-CH',
            flag: '🇨🇭',
            fatfCategory: 'FATF Compliant',
            riskScore: 18,
            riskLevel: 'LOW',
            totalVolume: 9800000,
            txCount: 1120,
            flaggedAccountsCount: 1,
            eddEnforced: false,
            autoFlagInbound: false,
            topCities: ['Zurich', 'Frankfurt', 'London', 'Paris', 'Geneva']
        },
        {
            id: 'apac',
            name: 'Asia-Pacific Hubs (SG, JP, HK, AU)',
            code: 'APAC',
            flag: '🇸🇬',
            fatfCategory: 'FATF Compliant',
            riskScore: 34,
            riskLevel: 'MEDIUM',
            totalVolume: 6400000,
            txCount: 780,
            flaggedAccountsCount: 3,
            eddEnforced: false,
            autoFlagInbound: false,
            topCities: ['Singapore', 'Tokyo', 'Hong Kong', 'Sydney']
        },
        {
            id: 'mena',
            name: 'Middle East & GCC (UAE, QA, SA)',
            code: 'GCC-ME',
            flag: '🇦🇪',
            fatfCategory: 'Monitored Jurisdiction',
            riskScore: 58,
            riskLevel: 'MEDIUM',
            totalVolume: 4200000,
            txCount: 410,
            flaggedAccountsCount: 5,
            eddEnforced: true,
            autoFlagInbound: false,
            topCities: ['Dubai', 'Abu Dhabi', 'Doha', 'Riyadh']
        },
        {
            id: 'latam_offshore',
            name: 'Latin America & Offshore Banking (BR, MX, KY, PA)',
            code: 'LATAM-OFF',
            flag: '🇰🇾',
            fatfCategory: 'Monitored Jurisdiction',
            riskScore: 74,
            riskLevel: 'HIGH',
            totalVolume: 2800000,
            txCount: 290,
            flaggedAccountsCount: 7,
            eddEnforced: true,
            autoFlagInbound: true,
            topCities: ['Cayman Islands', 'Panama City', 'São Paulo', 'Mexico City']
        },
        {
            id: 'fatf_highrisk',
            name: 'FATF High-Risk & Embargoed Jurisdictions',
            code: 'FATF-RED',
            flag: '⚠️',
            fatfCategory: 'High-Risk Jurisdiction',
            riskScore: 94,
            riskLevel: 'CRITICAL',
            totalVolume: 450000,
            txCount: 24,
            flaggedAccountsCount: 12,
            eddEnforced: true,
            autoFlagInbound: true,
            topCities: ['Tehran', 'Pyongyang', 'Naypyidaw', 'Damascus']
        }
    ]);

    // Dynamically calculate transaction metrics from real transactions prop
    const computedRegions = useMemo(() => {
        if (!transactions || transactions.length === 0) return regions;

        const regionVolumeMap: Record<string, { volume: number; count: number; flagged: number }> = {
            us_ca: { volume: 0, count: 0, flagged: 0 },
            eu_ch: { volume: 0, count: 0, flagged: 0 },
            apac: { volume: 0, count: 0, flagged: 0 },
            mena: { volume: 0, count: 0, flagged: 0 },
            latam_offshore: { volume: 0, count: 0, flagged: 0 },
            fatf_highrisk: { volume: 0, count: 0, flagged: 0 },
        };

        transactions.forEach(tx => {
            const amt = Number(tx.sendAmount || tx.receiveAmount || 0);
            const desc = (tx.description || '').toLowerCase();
            const curr = ((tx as any).currency || (tx as any).sendCurrency || tx.baseCurrency || 'USD').toUpperCase();
            const isFlagged = tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE || tx.status === TransactionStatus.PAUSED_ON_HOLD;

            let targetRegion = 'us_ca';
            if (curr === 'EUR' || curr === 'GBP' || curr === 'CHF' || desc.includes('switzerland') || desc.includes('london') || desc.includes('zurich')) {
                targetRegion = 'eu_ch';
            } else if (curr === 'SGD' || curr === 'JPY' || curr === 'HKD' || curr === 'AUD' || desc.includes('singapore') || desc.includes('tokyo') || desc.includes('hong kong')) {
                targetRegion = 'apac';
            } else if (curr === 'AED' || curr === 'SAR' || curr === 'QAR' || desc.includes('dubai') || desc.includes('uae') || desc.includes('middle east')) {
                targetRegion = 'mena';
            } else if (desc.includes('cayman') || desc.includes('panama') || desc.includes('offshore') || desc.includes('caribbean')) {
                targetRegion = 'latam_offshore';
            } else if (desc.includes('embargo') || desc.includes('sanction') || isFlagged) {
                targetRegion = 'fatf_highrisk';
            }

            if (regionVolumeMap[targetRegion]) {
                regionVolumeMap[targetRegion].volume += amt;
                regionVolumeMap[targetRegion].count += 1;
                if (isFlagged) regionVolumeMap[targetRegion].flagged += 1;
            }
        });

        return regions.map(r => {
            const aggregated = regionVolumeMap[r.id];
            if (!aggregated) return r;
            const newVol = r.totalVolume + aggregated.volume;
            const newCount = r.txCount + aggregated.count;
            const newFlagged = r.flaggedAccountsCount + aggregated.flagged;
            return {
                ...r,
                totalVolume: newVol,
                txCount: newCount,
                flaggedAccountsCount: newFlagged
            };
        });
    }, [regions, transactions]);

    const activeRegion = useMemo(() => {
        return computedRegions.find(r => r.id === selectedRegionId) || computedRegions[0];
    }, [computedRegions, selectedRegionId]);

    // Chart Data
    const chartData = useMemo(() => {
        return computedRegions.map(r => ({
            name: r.code,
            fullName: r.name,
            Volume: Number((r.totalVolume / 1000000).toFixed(2)), // in Millions $
            FlaggedAccounts: r.flaggedAccountsCount,
            RiskScore: r.riskScore
        }));
    }, [computedRegions]);

    // Toggle Enhanced Due Diligence (EDD)
    const handleToggleEDD = (regionId: string) => {
        setRegions(prev => prev.map(r => {
            if (r.id === regionId) {
                const updated = !r.eddEnforced;
                if (addToast) {
                    addToast(
                        updated ? 'warning' : 'info',
                        'Jurisdiction Compliance Updated',
                        `${updated ? 'Enforced Enhanced Due Diligence (EDD)' : 'Relaxed EDD rules'} for ${r.name}.`
                    );
                }
                return { ...r, eddEnforced: updated };
            }
            return r;
        }));
    };

    // Toggle Auto-Flag Inbound Transfers
    const handleToggleAutoFlag = (regionId: string) => {
        setRegions(prev => prev.map(r => {
            if (r.id === regionId) {
                const updated = !r.autoFlagInbound;
                if (addToast) {
                    addToast(
                        updated ? 'warning' : 'info',
                        'Auto-Flag Protocol Modified',
                        `Inbound transfers from ${r.name} will now be ${updated ? 'AUTOMATICALLY FLAGGED FOR REVIEW' : 'processed under normal rules'}.`
                    );
                }
                return { ...r, autoFlagInbound: updated };
            }
            return r;
        }));
    };

    // Filter regions by search or risk level
    const filteredRegions = useMemo(() => {
        return computedRegions.filter(r => {
            if (filterRiskLevel !== 'ALL' && r.riskLevel !== filterRiskLevel) return false;
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.topCities.some(c => c.toLowerCase().includes(q));
        });
    }, [computedRegions, searchTerm, filterRiskLevel]);

    // Helper for risk badge styling
    const getRiskBadge = (level: RegionData['riskLevel']) => {
        switch (level) {
            case 'LOW':
                return 'bg-emerald-500 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10';
            case 'MEDIUM':
                return 'bg-amber-500 text-amber-300 border-amber-500/40 shadow-amber-500/10';
            case 'HIGH':
                return 'bg-orange-500 text-orange-300 border-orange-500/40 shadow-orange-500/10';
            case 'CRITICAL':
                return 'bg-rose-500 text-rose-300 border-rose-500/40 shadow-rose-500/20 animate-pulse';
        }
    };

    const getRiskColor = (level: RegionData['riskLevel']) => {
        switch (level) {
            case 'LOW': return '#10b981';
            case 'MEDIUM': return '#f59e0b';
            case 'HIGH': return '#f97316';
            case 'CRITICAL': return '#f43f5e';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-cyan-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-2xl text-slate-950 shadow-xl shadow-cyan-500/20">
                            <GlobeAmericasIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
                                    INTERNATIONAL GEO-COMPLIANCE HEATMAP
                                </h2>
                                <span className="px-3 py-1 bg-cyan-500 border border-cyan-500/40 text-cyan-300 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                    REAL-TIME JURISDICTIONAL RADAR
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] font-mono mt-1">
                                Global distribution of transaction volume, active flagged accounts, OFAC sanctions compliance & high-risk FATF jurisdictions.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (addToast) addToast('info', 'FATF Audit Sync', 'Synchronized latest FATF blacklists and international PEP registries.');
                            }}
                            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-500 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Refresh FATF Feed
                        </button>
                    </div>
                </div>
            </div>

            {/* Split Grid: Geo Heatmap Matrix & Interactive Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 7 Columns: International Jurisdiction Heat Cards */}
                <div className="lg:col-span-7 space-y-4">
                    
                    {/* Filter & Search Bar */}
                    <div className="bg-slate-50 border border-black/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 dark:bg-slate-900">
                        <div className="relative w-full sm:w-64">
                            <MagnifyingGlassIcon className="w-4 h-4 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search jurisdiction or city..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-black/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setFilterRiskLevel(lvl)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                        filterRiskLevel === lvl
                                            ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                                            : 'bg-slate-100 text-[#0F172A] hover:text-white border border-black/5'
                                    }`}
                                >
                                    {lvl} RISK
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredRegions.map((r) => {
                            const isSelected = r.id === selectedRegionId;
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedRegionId(r.id)}
                                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                                        isSelected
                                            ? 'bg-slate-50 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.02]'
                                            : 'bg-slate-50 border-black/5 hover:border-white/20 hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Top Line & Flag */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl">{r.flag}</span>
                                            <div>
                                                <span className="text-xs font-black text-white font-mono block tracking-wider">
                                                    {r.code}
                                                </span>
                                                <span className="text-[10px] text-[#0F172A] font-mono block">
                                                    {r.fatfCategory}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black font-mono border uppercase ${getRiskBadge(r.riskLevel)}`}>
                                            {r.riskLevel} ({r.riskScore}/100)
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-bold text-white mb-3 line-clamp-1">
                                        {r.name}
                                    </h4>

                                    {/* Risk Bar */}
                                    <div className="space-y-1 mb-4">
                                        <div className="flex justify-between text-[10px] font-mono text-[#0F172A]">
                                            <span>Jurisdictional Risk Score:</span>
                                            <span style={{ color: getRiskColor(r.riskLevel) }} className="font-bold">
                                                {r.riskScore}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-black/5">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${r.riskScore}%`,
                                                    backgroundColor: getRiskColor(r.riskLevel)
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-black/5 pt-3">
                                        <div>
                                            <span className="text-[#0F172A] block">Volume:</span>
                                            <span className="text-white font-bold text-xs">
                                                ${(r.totalVolume / 1000000).toFixed(2)}M
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#0F172A] block">Flagged Accounts:</span>
                                            <span className={`font-bold text-xs ${r.flaggedAccountsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {r.flaggedAccountsCount} Accounts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right 5 Columns: Selected Jurisdiction Detailed Telemetry Inspector */}
                <div className="lg:col-span-5 bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between space-y-6 dark:bg-slate-900">
                    <div>
                        <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-5">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{activeRegion.flag}</span>
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                        {activeRegion.name}
                                    </h3>
                                    <p className="text-[10px] text-[#0F172A] font-mono">Jurisdictional Governance & Risk Controls</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border uppercase ${getRiskBadge(activeRegion.riskLevel)}`}>
                                {activeRegion.riskLevel}
                            </span>
                        </div>

                        {/* Telemetry Metrics List */}
                        <div className="space-y-3 font-mono text-xs mb-6">
                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5 flex justify-between items-center">
                                <span className="text-[#0F172A]">FATF Compliance Rating:</span>
                                <span className="text-cyan-300 font-bold">{activeRegion.fatfCategory}</span>
                            </div>

                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5 flex justify-between items-center">
                                <span className="text-[#0F172A]">Total Settlement Volume:</span>
                                <span className="text-white font-bold text-sm">${activeRegion.totalVolume.toLocaleString()} USD</span>
                            </div>

                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5 flex justify-between items-center">
                                <span className="text-[#0F172A]">Total Transaction Count:</span>
                                <span className="text-[#1E293B] font-bold">{activeRegion.txCount.toLocaleString()} transfers</span>
                            </div>

                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5 flex justify-between items-center">
                                <span className="text-[#0F172A]">Active Flagged Accounts:</span>
                                <span className={`font-bold ${activeRegion.flaggedAccountsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {activeRegion.flaggedAccountsCount} High-Risk Accounts
                                </span>
                            </div>

                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5">
                                <span className="text-[#0F172A] block mb-1.5">Primary Transit Hubs:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeRegion.topCities.map(city => (
                                        <span key={city} className="px-2 py-0.5 bg-white text-[#0F172A] rounded text-[10px] dark:bg-slate-800">
                                            {city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls & Toggles */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest font-mono">
                                Jurisdiction Security Enclaves
                            </h4>

                            <div className="p-4 bg-slate-100 border border-black/5 rounded-2xl flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-bold text-white block">Enhanced Due Diligence (EDD)</span>
                                    <span className="text-[10px] text-[#0F172A] block">Require source-of-funds verification for all transactions.</span>
                                </div>
                                <button
                                    onClick={() => handleToggleEDD(activeRegion.id)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        activeRegion.eddEnforced
                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
                                            : 'bg-white text-[#0F172A] hover:text-white'
                                    }`}
                                >
                                    {activeRegion.eddEnforced ? 'ENFORCED' : 'OFF'}
                                </button>
                            </div>

                            <div className="p-4 bg-slate-100 border border-black/5 rounded-2xl flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-bold text-white block">Auto-Flag Inbound Transfers</span>
                                    <span className="text-[10px] text-[#0F172A] block font-mono">Automatically place inbound transfers into FLAGGED_AWAITING_CLEARANCE.</span>
                                </div>
                                <button
                                    onClick={() => handleToggleAutoFlag(activeRegion.id)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        activeRegion.autoFlagInbound
                                            ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-950 animate-pulse'
                                            : 'bg-white text-[#0F172A] hover:text-white'
                                    }`}
                                >
                                    {activeRegion.autoFlagInbound ? 'ACTIVE' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Report Export Button */}
                    <button
                        onClick={() => {
                            if (addToast) addToast('success', 'Report Generated', `Exported FATF Jurisdictional Risk Brief for ${activeRegion.name} (PDF).`);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        Export Jurisdictional Report (PDF)
                    </button>
                </div>

            </div>

            {/* Recharts Jurisdictional Volume & Risk Score Matrix */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4">
                    <div>
                        <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                            Global Regional Volume ($M) vs Jurisdictional Risk Score (%)
                        </h3>
                        <p className="text-xs text-[#0F172A] font-mono">Comparative analysis of transaction velocity across FATF compliance categories</p>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                            <YAxis yAxisId="left" orientation="left" stroke="#06b6d4" fontSize={10} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px' }}
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Bar yAxisId="left" dataKey="Volume" name="Volume ($ Millions)" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="RiskScore" name="Risk Score (%)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
