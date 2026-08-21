import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Account, CryptoAsset, CryptoHolding, Transaction, TransactionStatus } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
    ChartBarIcon, 
    ArrowPathIcon, 
    ShieldCheckIcon, 
    ZapIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    BankIcon, 
    ArrowRightIcon, 
    ArrowDownTrayIcon,
    TrendingUpIcon,
    AlertTriangleIcon,
    LockClosedIcon,
    ArrowsRightLeftIcon
} from './Icons';
import { downloadTransactionPDFReceipt } from '../utils/pdfReceiptGenerator';

export interface RiskProfile {
    id: string;
    name: string;
    fiatTargetPercent: number;
    cryptoTargetPercent: number;
    description: string;
    badgeColor: string;
    riskLevel: 'Low' | 'Moderate' | 'Growth' | 'High';
}

export const RISK_PROFILES: RiskProfile[] = [
    {
        id: 'conservative',
        name: 'Conservative Treasury',
        fiatTargetPercent: 80,
        cryptoTargetPercent: 20,
        description: 'Emphasizes capital preservation, high liquidity cash reserves, and minimal crypto exposure.',
        badgeColor: 'bg-emerald-500 text-emerald-500 border-emerald-500/20',
        riskLevel: 'Low'
    },
    {
        id: 'balanced',
        name: 'Balanced Sovereign',
        fiatTargetPercent: 60,
        cryptoTargetPercent: 40,
        description: 'Optimal equilibrium between stable yield-bearing fiat cash and digital assets.',
        badgeColor: 'bg-amber-500 text-amber-500 border-amber-500/20',
        riskLevel: 'Moderate'
    },
    {
        id: 'growth',
        name: 'Growth Multi-Asset',
        fiatTargetPercent: 40,
        cryptoTargetPercent: 60,
        description: 'Prioritizes upside expansion with major crypto assets while maintaining core emergency liquidity.',
        badgeColor: 'bg-indigo-500 text-indigo-500 border-indigo-500/20',
        riskLevel: 'Growth'
    },
    {
        id: 'aggressive',
        name: 'Crypto High Conviction',
        fiatTargetPercent: 20,
        cryptoTargetPercent: 80,
        description: 'Maximum digital asset exposure focused on BTC, ETH, and high-yield staking vaults.',
        badgeColor: 'bg-purple-500 text-purple-500 border-purple-500/20',
        riskLevel: 'High'
    }
];

interface AssetAllocationIntelligenceProps {
    accounts?: Account[];
    cryptoHoldings?: CryptoHolding[];
    cryptoAssets?: CryptoAsset[];
    onExecuteRebalance?: (transfers: { from: string; to: string; amount: number }[]) => void;
    className?: string;
}

// Default fallback data if props are omitted
const DEFAULT_ACCOUNTS: Account[] = [
    { id: 'acc-1', nickname: 'Sovereign Wealth Vault', accountNumber: '4829102938', balance: 145200.00, type: 'Checking' as any, currency: 'USD', features: [] },
    { id: 'acc-2', nickname: 'High-Yield Reserve', accountNumber: '9920194821', balance: 84500.00, type: 'Savings' as any, currency: 'USD', features: [] },
    { id: 'acc-3', nickname: 'Institutional Certificate of Deposit', accountNumber: '3391028491', balance: 50000.00, type: 'Certificate of Deposit' as any, currency: 'USD', features: [] }
];

const DEFAULT_CRYPTO_ASSETS: Partial<CryptoAsset>[] = [
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 92450.00 },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3420.00 },
    { id: 'sol', symbol: 'SOL', name: 'Solana', price: 185.00 },
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', price: 1.00 }
];

const DEFAULT_CRYPTO_HOLDINGS: CryptoHolding[] = [
    { assetId: 'btc', amount: 1.45, avgBuyPrice: 65000 },
    { assetId: 'eth', amount: 12.8, avgBuyPrice: 2800 },
    { assetId: 'sol', amount: 85, avgBuyPrice: 120 },
    { assetId: 'usdt', amount: 25000, avgBuyPrice: 1.00 }
];

export const AssetAllocationIntelligence: React.FC<AssetAllocationIntelligenceProps> = ({
    accounts = DEFAULT_ACCOUNTS,
    cryptoHoldings = DEFAULT_CRYPTO_HOLDINGS,
    cryptoAssets = DEFAULT_CRYPTO_ASSETS as CryptoAsset[],
    onExecuteRebalance,
    className = ''
}) => {
    const { formatCurrency } = useCurrency();
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [selectedProfileId, setSelectedProfileId] = useState<string>('balanced');
    const [customCryptoPercent, setCustomCryptoPercent] = useState<number>(40);
    const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
    const [tooltipData, setTooltipData] = useState<{ x: number; y: number; label: string; value: number; percent: number; category: string } | null>(null);
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);
    const [executedTxRef, setExecutedTxRef] = useState<string | null>(null);

    // Calculate total balances
    const fiatTotal = useMemo(() => {
        return accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
    }, [accounts]);

    const cryptoDetails = useMemo(() => {
        return cryptoHoldings.map(h => {
            const asset = cryptoAssets.find(a => a.id === h.assetId || a.symbol.toLowerCase() === h.assetId.toLowerCase()) || {
                id: h.assetId,
                name: h.assetId.toUpperCase(),
                symbol: h.assetId.toUpperCase(),
                price: h.assetId === 'btc' ? 92450 : (h.assetId === 'eth' ? 3420 : (h.assetId === 'sol' ? 185 : 1))
            };
            const val = (h.amount || 0) * (asset.price || 1);
            return {
                ...h,
                name: asset.name,
                symbol: asset.symbol,
                price: asset.price,
                totalValue: val
            };
        });
    }, [cryptoHoldings, cryptoAssets]);

    const cryptoTotal = useMemo(() => {
        return cryptoDetails.reduce((acc, curr) => acc + curr.totalValue, 0);
    }, [cryptoDetails]);

    const portfolioTotal = fiatTotal + cryptoTotal;

    const currentFiatPercent = portfolioTotal > 0 ? (fiatTotal / portfolioTotal) * 100 : 50;
    const currentCryptoPercent = portfolioTotal > 0 ? (cryptoTotal / portfolioTotal) * 100 : 50;

    // Active Target Percentages
    const activeTargetCryptoPercent = useMemo(() => {
        if (isCustomMode) return customCryptoPercent;
        const prof = RISK_PROFILES.find(p => p.id === selectedProfileId);
        return prof ? prof.cryptoTargetPercent : 40;
    }, [isCustomMode, customCryptoPercent, selectedProfileId]);

    const activeTargetFiatPercent = 100 - activeTargetCryptoPercent;

    // Target monetary values
    const targetFiatValue = (portfolioTotal * activeTargetFiatPercent) / 100;
    const targetCryptoValue = (portfolioTotal * activeTargetCryptoPercent) / 100;

    // Rebalance Deltas
    const fiatDriftVal = fiatTotal - targetFiatValue; // Positive = excess fiat (need to buy crypto)
    const cryptoDriftVal = cryptoTotal - targetCryptoValue; // Positive = excess crypto (need to sell crypto)

    const needsRebalance = Math.abs(fiatDriftVal) > 50;

    // Rebalance strategy action plan
    const rebalancePlan = useMemo(() => {
        if (!needsRebalance) {
            return {
                action: 'HOLD',
                summary: 'Portfolio is in optimal alignment with target risk parameters.',
                amount: 0,
                directionText: 'No rebalance required at this time.'
            };
        }

        if (fiatDriftVal > 0) {
            // Excess Fiat -> Buy Crypto
            return {
                action: 'BUY_CRYPTO',
                summary: `Rebalance $${Math.abs(fiatDriftVal).toLocaleString('en-US', { maximumFractionDigits: 2 })} from Fiat Cash reserves into Digital Vaults`,
                amount: Math.abs(fiatDriftVal),
                fromLabel: 'Sovereign Cash Ledger',
                toLabel: 'Bitcoin (BTC) & Ethereum (ETH) Vaults',
                directionText: `Move ${((fiatDriftVal / portfolioTotal) * 100).toFixed(1)}% of total portfolio capital into crypto.`
            };
        } else {
            // Excess Crypto -> Sell Crypto to Fiat
            return {
                action: 'SELL_CRYPTO',
                summary: `Rebalance $${Math.abs(cryptoDriftVal).toLocaleString('en-US', { maximumFractionDigits: 2 })} from Digital Assets into High-Yield Fiat Reserve`,
                amount: Math.abs(cryptoDriftVal),
                fromLabel: 'Crypto Asset Holdings',
                toLabel: 'High-Yield Reserve Account',
                directionText: `Liquidate ${((cryptoDriftVal / portfolioTotal) * 100).toFixed(1)}% of crypto profits into cash safety.`
            };
        }
    }, [fiatDriftVal, cryptoDriftVal, portfolioTotal, needsRebalance]);

    // D3 Visualization Render Logic
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 340;
        const height = 300;
        const radius = Math.min(width, height) / 2 - 25;

        // Clear previous SVG contents
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        svg.attr('width', width)
           .attr('height', height)
           .attr('viewBox', `0 0 ${width} ${height}`);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Color palettes
        const fiatColors = ['#10b981', '#34d399', '#059669']; // Emeralds
        const cryptoColors = ['#f59e0b', '#6366f1', '#8b5cf6', '#ec4899']; // Gold, Indigo, Purple, Pink

        // Data arrays for Pie Generators
        // Inner Ring: Current Holdings Breakdown
        const currentData = [
            ...accounts.map((a, i) => ({
                label: a.nickname || a.type || 'Account',
                category: 'Fiat',
                value: a.balance || 0,
                color: fiatColors[i % fiatColors.length]
            })),
            ...cryptoDetails.map((c, i) => ({
                label: `${c.symbol} (${c.name})`,
                category: 'Crypto',
                value: c.totalValue,
                color: cryptoColors[i % cryptoColors.length]
            }))
        ];

        // Outer Ring: Target Profile Split
        const targetData = [
            { label: 'Target Fiat Reserve', category: 'Fiat Target', value: targetFiatValue, color: '#059669' },
            { label: 'Target Digital Vault', category: 'Crypto Target', value: targetCryptoValue, color: '#f59e0b' }
        ];

        // Pie Generators
        const pieGenerator = d3.pie<any>()
            .value((d: any) => d.value)
            .sort(null);

        // Arc Generators
        // Inner Arc (Current Breakdown)
        const innerArc = d3.arc<any>()
            .innerRadius(radius * 0.45)
            .outerRadius(radius * 0.72)
            .cornerRadius(4)
            .padAngle(0.02);

        // Outer Arc (Target Profile Spectrum)
        const outerArc = d3.arc<any>()
            .innerRadius(radius * 0.78)
            .outerRadius(radius * 0.95)
            .cornerRadius(5)
            .padAngle(0.03);

        // 1. Render Outer Ring (Target Allocation)
        const targetArcs = pieGenerator(targetData);

        const outerG = g.append('g').attr('class', 'target-ring');

        outerG.selectAll('path')
            .data(targetArcs)
            .enter()
            .append('path')
            .attr('d', outerArc as any)
            .attr('fill', (d: any) => d.data.color)
            .attr('opacity', 0.85)
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .on('mouseover', (event: MouseEvent, d: any) => {
                d3.select(event.currentTarget as SVGPathElement)
                    .transition().duration(200)
                    .attr('opacity', 1)
                    .attr('transform', 'scale(1.04)');

                const pct = portfolioTotal > 0 ? (d.data.value / portfolioTotal) * 100 : 0;
                setTooltipData({
                    x: event.clientX,
                    y: event.clientY,
                    label: d.data.label,
                    category: d.data.category,
                    value: d.data.value,
                    percent: pct
                });
            })
            .on('mouseout', (event: MouseEvent) => {
                d3.select(event.currentTarget as SVGPathElement)
                    .transition().duration(200)
                    .attr('opacity', 0.85)
                    .attr('transform', 'scale(1)');
                setTooltipData(null);
            });

        // 2. Render Inner Ring (Current Breakdown)
        const currentArcs = pieGenerator(currentData);

        const innerG = g.append('g').attr('class', 'current-ring');

        innerG.selectAll('path')
            .data(currentArcs)
            .enter()
            .append('path')
            .attr('d', innerArc as any)
            .attr('fill', (d: any) => d.data.color)
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .on('mouseover', (event: MouseEvent, d: any) => {
                d3.select(event.currentTarget as SVGPathElement)
                    .transition().duration(200)
                    .attr('transform', 'scale(1.05)');

                const pct = portfolioTotal > 0 ? (d.data.value / portfolioTotal) * 100 : 0;
                setTooltipData({
                    x: event.clientX,
                    y: event.clientY,
                    label: d.data.label,
                    category: d.data.category,
                    value: d.data.value,
                    percent: pct
                });
            })
            .on('mouseout', (event: MouseEvent) => {
                d3.select(event.currentTarget as SVGPathElement)
                    .transition().duration(200)
                    .attr('transform', 'scale(1)');
                setTooltipData(null);
            });

        // Center Text Readout (D3 Text Elements)
        const centerGroup = g.append('g').attr('text-anchor', 'middle');

        centerGroup.append('text')
            .attr('dy', '-0.5em')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .text('PORTFOLIO RATIO');

        centerGroup.append('text')
            .attr('dy', '0.7em')
            .attr('fill', '#ffffff')
            .attr('font-size', '16px')
            .attr('font-weight', '900')
            .text(`${currentFiatPercent.toFixed(0)}% Fiat / ${currentCryptoPercent.toFixed(0)}% Crypto`);

        centerGroup.append('text')
            .attr('dy', '2.2em')
            .attr('fill', Math.abs(fiatDriftVal) < 100 ? '#10b981' : '#f59e0b')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .text(Math.abs(fiatDriftVal) < 100 ? '✓ IN ALIGNMENT' : `DRIFT: ${Math.abs(currentCryptoPercent - activeTargetCryptoPercent).toFixed(1)}%`);

    }, [accounts, cryptoDetails, portfolioTotal, activeTargetCryptoPercent, activeTargetFiatPercent, currentFiatPercent, currentCryptoPercent, targetFiatValue, targetCryptoValue, fiatDriftVal]);

    // Execute Rebalance handler
    const handleExecuteRebalance = () => {
        setIsExecuting(true);
        const txId = `REBAL-${Math.floor(100000 + Math.random() * 900000)}`;

        setTimeout(() => {
            setIsExecuting(false);
            setExecutionSuccess(true);
            setExecutedTxRef(txId);

            if (onExecuteRebalance && rebalancePlan.amount > 0) {
                onExecuteRebalance([{
                    from: rebalancePlan.fromLabel || 'Sovereign Cash Ledger',
                    to: rebalancePlan.toLabel || 'Digital Vault',
                    amount: rebalancePlan.amount
                }]);
            }
        }, 1200);
    };

    // Download Official PDF Receipt for Rebalance
    const handleDownloadReceipt = () => {
        const mockTx: Transaction = {
            id: executedTxRef || `REBAL-${Math.floor(100000 + Math.random() * 900000)}`,
            accountId: accounts[0]?.id || 'acc-1',
            sendAmount: rebalancePlan.amount,
            receiveAmount: rebalancePlan.amount,
            fee: 0,
            complianceFee: 0,
            exchangeRate: 1,
            baseCurrency: 'USD',
            receiveCurrency: 'USD',
            description: 'Algorithmic Portfolio Rebalance',
            estimatedArrival: new Date(),
            type: 'debit' as any,
            status: TransactionStatus.FUNDS_ARRIVED,
            transferMethod: 'ALGORITHMIC REBALANCE RAIL',
            statusTimestamps: {
                [TransactionStatus.SUBMITTED]: new Date(),
                [TransactionStatus.FUNDS_ARRIVED]: new Date()
            },
            recipient: {
                id: 'rebal-vault',
                fullName: rebalancePlan.toLabel || 'First Pacific Digital Vault',
                accountNumber: '•••• 9901',
                bankName: 'First Pacific Sovereign Vault',
                country: 'United States' as any,
                routingNumber: 'FPBKUS33',
                realDetails: {} as any
            }
        };

        downloadTransactionPDFReceipt(mockTx, {
            issuerName: 'First Pacific Bank - Asset Allocation Intelligence',
            account: accounts[0]
        });
    };

    return (
        <div className={`bg-slate-50 border border-slate-200 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden ${className}`}>
            {/* Background Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                            <ChartBarIcon className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                Asset Allocation Intelligence
                                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500 text-emerald-400 border border-emerald-500/20">
                                    D3 Engine Active
                                </span>
                            </h2>
                            <p className="text-xs text-[#0F172A] mt-0.5">
                                Real-time Crypto vs. Fiat Ratio Analysis & Algorithmic Rebalancing Engine
                            </p>
                        </div>
                    </div>
                </div>

                {/* Portfolio Total Snapshot */}
                <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-xl border border-black/5">
                    <div>
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider block">Total Portfolio Capital</span>
                        <span className="text-lg font-black text-white font-mono">{formatCurrency(portfolioTotal)}</span>
                    </div>
                    <div className="h-8 w-px bg-white dark:bg-slate-800"></div>
                    <div>
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider block">Allocation Split</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                            {currentFiatPercent.toFixed(1)}% Cash / {currentCryptoPercent.toFixed(1)}% Crypto
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                
                {/* Left Column: Risk Profiles & Target Controls (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowsRightLeftIcon className="w-3.5 h-3.5 text-amber-400" />
                            Target Risk Profiles
                        </h3>

                        <button
                            onClick={() => setIsCustomMode(!isCustomMode)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all border ${
                                isCustomMode 
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' 
                                    : 'bg-white text-[#0F172A] border-black/5 hover:bg-slate-700'
                            }`}
                        >
                            {isCustomMode ? 'Custom Active' : 'Enable Custom Target'}
                        </button>
                    </div>

                    {!isCustomMode ? (
                        <div className="grid grid-cols-1 gap-2.5">
                            {RISK_PROFILES.map((profile) => {
                                const isSelected = selectedProfileId === profile.id;
                                return (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfileId(profile.id)}
                                        className={`p-3.5 rounded-xl text-left transition-all border relative overflow-hidden ${
                                            isSelected 
                                                ? 'bg-white border-amber-500/50 shadow-lg ring-1 ring-amber-500/30' 
                                                : 'bg-slate-100 border-black/5 hover:border-black/5 hover:bg-slate-100'
                                        }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent pointer-events-none"></div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${profile.badgeColor}`}>
                                                    {profile.riskLevel} Risk
                                                </span>
                                                <h4 className="text-sm font-bold text-white">{profile.name}</h4>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-[#0F172A]">
                                                {profile.fiatTargetPercent}% Fiat / {profile.cryptoTargetPercent}% Crypto
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#0F172A] mt-1.5 leading-relaxed">
                                            {profile.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Custom Allocation Slider Box */
                        <div className="bg-slate-100 p-5 rounded-xl border border-amber-500/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Custom Allocation Spectrum</span>
                                <span className="text-sm font-mono font-bold text-white">{100 - customCryptoPercent}% Fiat / {customCryptoPercent}% Crypto</span>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={customCryptoPercent}
                                    onChange={(e) => setCustomCryptoPercent(Number(e.target.value))}
                                    className="w-full accent-amber-500 bg-white h-2 rounded-lg cursor-pointer dark:bg-slate-800"
                                />
                                <div className="flex justify-between text-[10px] text-[#0F172A] font-mono">
                                    <span>100% Cash / 0% Crypto</span>
                                    <span>50% / 50%</span>
                                    <span>0% Cash / 100% Crypto</span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg text-xs text-[#0F172A] border border-black/5 space-y-1 dark:bg-slate-900">
                                <div className="flex justify-between">
                                    <span className="text-[#0F172A]">Target Cash Reserve:</span>
                                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(targetFiatValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#0F172A]">Target Digital Vaults:</span>
                                    <span className="font-mono font-bold text-amber-400">{formatCurrency(targetCryptoValue)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: D3 Donut Visualizer & Rebalance Engine (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    
                    {/* D3 Canvas Card */}
                    <div className="bg-slate-100 p-4 rounded-xl border border-black/5 flex flex-col items-center justify-center relative min-h-[320px]">
                        <div className="w-full flex items-center justify-between px-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                <span className="text-[11px] font-bold text-[#0F172A]">Inner: Current Breakdown</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                <span className="text-[11px] font-bold text-[#0F172A]">Outer: Target Profile Spectrum</span>
                            </div>
                        </div>

                        {/* D3 SVG Canvas */}
                        <div ref={containerRef} className="w-full flex items-center justify-center">
                            <svg ref={svgRef}></svg>
                        </div>

                        {/* Hover Tooltip Overlay */}
                        {tooltipData && (
                            <div 
                                className="fixed z-50 bg-slate-50 border border-amber-500/40  p-3 rounded-xl shadow-2xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3 space-y-1 dark:bg-slate-900"
                                style={{ left: tooltipData.x, top: tooltipData.y }}
                            >
                                <div className="font-bold text-white flex items-center justify-between gap-3">
                                    <span>{tooltipData.label}</span>
                                    <span className="text-[10px] text-amber-400 uppercase font-mono">{tooltipData.category}</span>
                                </div>
                                <div className="text-[#0F172A] font-mono">
                                    {formatCurrency(tooltipData.value)} ({tooltipData.percent.toFixed(1)}% of total)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Algorithmic Rebalancing Action Card */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-amber-400" />
                                <div>
                                    <h4 className="text-sm font-bold text-white">Algorithmic Rebalance Strategy</h4>
                                    <p className="text-xs text-[#0F172A]">{rebalancePlan.directionText}</p>
                                </div>
                            </div>

                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${
                                !needsRebalance 
                                    ? 'bg-emerald-500 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-amber-500 text-amber-400 border-amber-500/20'
                            }`}>
                                {needsRebalance ? `Drift: ${formatCurrency(rebalancePlan.amount)}` : 'In Alignment'}
                            </span>
                        </div>

                        {needsRebalance ? (
                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-lg border border-black/5 flex items-center justify-between text-xs dark:bg-slate-900">
                                    <div className="space-y-0.5">
                                        <span className="text-[#0F172A] text-[10px] uppercase font-bold">Source Capital</span>
                                        <p className="font-bold text-white">{rebalancePlan.fromLabel}</p>
                                    </div>

                                    <div className="p-2 bg-white rounded-full text-amber-400 dark:bg-slate-800">
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </div>

                                    <div className="space-y-0.5 text-right">
                                        <span className="text-[#0F172A] text-[10px] uppercase font-bold">Destination Vault</span>
                                        <p className="font-bold text-emerald-400">{rebalancePlan.toLabel}</p>
                                    </div>
                                </div>

                                {!executionSuccess ? (
                                    <button
                                        onClick={handleExecuteRebalance}
                                        disabled={isExecuting}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isExecuting ? (
                                            <>
                                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                Executing Algorithmic Rebalance...
                                            </>
                                        ) : (
                                            <>
                                                <ZapIcon className="w-4 h-4" />
                                                Execute Rebalance ({formatCurrency(rebalancePlan.amount)})
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    /* Execution Success Banner */
                                    <div className="p-3.5 bg-emerald-950 border border-emerald-500/40 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Algorithmic Rebalance Successfully Executed!
                                            </div>
                                            <span className="text-[10px] font-mono text-[#0F172A]">{executedTxRef}</span>
                                        </div>
                                        <p className="text-xs text-[#0F172A]">
                                            Capital successfully rebalanced into target risk profile ratio. All ledgers updated.
                                        </p>
                                        <div className="pt-1 flex gap-2">
                                            <button
                                                onClick={handleDownloadReceipt}
                                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-500 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                                            >
                                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                Download Official PDF Receipt
                                            </button>
                                            <button
                                                onClick={() => setExecutionSuccess(false)}
                                                className="px-3 py-1.5 bg-white hover:bg-slate-700 text-[#0F172A] rounded-lg text-xs font-bold transition-all dark:bg-slate-800"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 bg-emerald-500 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                Portfolio ratio aligns perfectly with selected risk parameters. Rebalance monitoring active.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
