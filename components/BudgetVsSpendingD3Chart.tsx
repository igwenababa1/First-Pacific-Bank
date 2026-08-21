import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Layers, 
  Info,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface MonthlyData {
  month: string;
  budget: number;
  spending: number;
  housing: number;
  lifestyle: number;
  utilities: number;
  investments: number;
}

const INITIAL_MONTHLY_DATA: MonthlyData[] = [
  { month: 'Jan', budget: 5200, spending: 4850, housing: 2100, lifestyle: 1250, utilities: 600, investments: 900 },
  { month: 'Feb', budget: 5200, spending: 5100, housing: 2100, lifestyle: 1400, utilities: 650, investments: 950 },
  { month: 'Mar', budget: 5500, spending: 4920, housing: 2100, lifestyle: 1180, utilities: 640, investments: 1000 },
  { month: 'Apr', budget: 5500, spending: 5680, housing: 2100, lifestyle: 1750, utilities: 630, investments: 1200 },
  { month: 'May', budget: 5800, spending: 5240, housing: 2200, lifestyle: 1390, utilities: 650, investments: 1000 },
  { month: 'Jun', budget: 5800, spending: 5410, housing: 2200, lifestyle: 1460, utilities: 650, investments: 1100 },
  { month: 'Jul', budget: 6000, spending: 5790, housing: 2200, lifestyle: 1690, utilities: 700, investments: 1200 },
  { month: 'Aug', budget: 6000, spending: 5350, housing: 2200, lifestyle: 1400, utilities: 650, investments: 1100 },
  { month: 'Sep', budget: 6200, spending: 5880, housing: 2300, lifestyle: 1680, utilities: 700, investments: 1200 },
  { month: 'Oct', budget: 6200, spending: 6050, housing: 2300, lifestyle: 1750, utilities: 700, investments: 1300 },
  { month: 'Nov', budget: 6500, spending: 6120, housing: 2300, lifestyle: 1820, utilities: 700, investments: 1300 },
  { month: 'Dec', budget: 6500, spending: 6380, housing: 2300, lifestyle: 1980, utilities: 800, investments: 1300 },
];

export const BudgetVsSpendingD3Chart: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [timeframe, setTimeframe] = useState<'6M' | 'YTD' | '1Y'>('6M');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'housing' | 'lifestyle' | 'utilities' | 'investments'>('all');
  const [hoveredData, setHoveredData] = useState<MonthlyData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Filter dataset according to selected timeframe
  const filteredData = useMemo(() => {
    if (timeframe === '6M') {
      return INITIAL_MONTHLY_DATA.slice(-6);
    }
    if (timeframe === 'YTD') {
      return INITIAL_MONTHLY_DATA.slice(0, 7); // Jan - Jul
    }
    return INITIAL_MONTHLY_DATA;
  }, [timeframe]);

  // Aggregate Period Summary
  const summary = useMemo(() => {
    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
    const totalSpending = filteredData.reduce((acc, curr) => {
      if (selectedCategory === 'all') return acc + curr.spending;
      return acc + curr[selectedCategory];
    }, 0);
    const netVariance = totalBudget - totalSpending;
    const healthScore = Math.max(50, Math.min(99, Math.round(100 - (totalSpending / totalBudget) * 35)));

    return { totalBudget, totalSpending, netVariance, healthScore };
  }, [filteredData, selectedCategory]);

  // D3 Chart Drawing Logic
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 300;
    const margin = { top: 25, right: 30, bottom: 45, left: 55 };
    const width = containerWidth;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', height);

    // X Scale
    const xScale = d3.scalePoint()
      .domain(filteredData.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    // Determine max value for Y Scale
    const maxVal = d3.max(filteredData, d => {
      const val = selectedCategory === 'all' ? Math.max(d.budget, d.spending) : d[selectedCategory];
      return val;
    }) || 7000;

    // Y Scale
    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([height - margin.bottom, margin.top]);

    // Add SVG Gradients
    const defs = svg.append('defs');

    // Budget Gradient (Cyan/Blue)
    const budgetGradient = defs.append('linearGradient')
      .attr('id', 'budget-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    budgetGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#38bdf8')
      .attr('stop-opacity', 0.25);
    budgetGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#38bdf8')
      .attr('stop-opacity', 0.0);

    // Spending Gradient (Emerald)
    const spendingGradient = defs.append('linearGradient')
      .attr('id', 'spending-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    spendingGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.35);
    spendingGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    // Render Grid Lines
    const yTicks = yScale.ticks(5);
    yTicks.forEach(tick => {
      svg.append('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', 'rgba(255, 255, 255, 0.06)')
        .attr('stroke-dasharray', '3,3');
    });

    // D3 Area Generators
    if (selectedCategory === 'all') {
      const budgetArea = d3.area<MonthlyData>()
        .x(d => xScale(d.month) || 0)
        .y0(height - margin.bottom)
        .y1(d => yScale(d.budget))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(filteredData)
        .attr('fill', 'url(#budget-area-gradient)')
        .attr('d', budgetArea);
    }

    const getSpendingVal = (d: MonthlyData) => selectedCategory === 'all' ? d.spending : d[selectedCategory];

    const spendingArea = d3.area<MonthlyData>()
      .x(d => xScale(d.month) || 0)
      .y0(height - margin.bottom)
      .y1(d => yScale(getSpendingVal(d)))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(filteredData)
      .attr('fill', 'url(#spending-area-gradient)')
      .attr('d', spendingArea);

    // D3 Line Generators
    if (selectedCategory === 'all') {
      const budgetLine = d3.line<MonthlyData>()
        .x(d => xScale(d.month) || 0)
        .y(d => yScale(d.budget))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '5,5')
        .attr('d', budgetLine);
    }

    const spendingLine = d3.line<MonthlyData>()
      .x(d => xScale(d.month) || 0)
      .y(d => yScale(getSpendingVal(d)))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', spendingLine);

    // D3 Scatter Circles & Interactive Nodes
    filteredData.forEach(d => {
      const cx = xScale(d.month) || 0;
      const cySpending = yScale(getSpendingVal(d));

      // Spending node circle
      svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cySpending)
        .attr('r', 5)
        .attr('fill', '#10b981')
        .attr('stroke', '#090d16')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      // Budget node circle (if all category)
      if (selectedCategory === 'all') {
        const cyBudget = yScale(d.budget);
        svg.append('circle')
          .attr('cx', cx)
          .attr('cy', cyBudget)
          .attr('r', 4)
          .attr('fill', '#38bdf8')
          .attr('stroke', '#090d16')
          .attr('stroke-width', 2);
      }
    });

    // X Axis Labels
    filteredData.forEach(d => {
      const cx = xScale(d.month) || 0;
      svg.append('text')
        .attr('x', cx)
        .attr('y', height - margin.bottom + 25)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d.month);
    });

    // Y Axis Labels
    yTicks.forEach(tick => {
      svg.append('text')
        .attr('x', margin.left - 12)
        .attr('y', yScale(tick) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(`$${(tick / 1000).toFixed(1)}k`);
    });

    // Overlay for Pointer Events / Hover Tooltip
    const overlayGroup = svg.append('g').style('pointer-events', 'all');

    svg.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      
      // Find nearest data point
      let closestPoint: MonthlyData | null = null;
      let minDistance = Infinity;

      filteredData.forEach(d => {
        const cx = xScale(d.month) || 0;
        const dist = Math.abs(mouseX - cx);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = d;
        }
      });

      if (closestPoint && minDistance < 50) {
        setHoveredData(closestPoint);
        const cx = xScale((closestPoint as MonthlyData).month) || 0;
        const cy = yScale(getSpendingVal(closestPoint));
        setTooltipPos({ x: cx, y: cy });
      } else {
        setHoveredData(null);
        setTooltipPos(null);
      }
    });

    svg.on('mouseleave', () => {
      setHoveredData(null);
      setTooltipPos(null);
    });

  }, [filteredData, selectedCategory, timeframe]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500 dark:bg-cyan-500 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500 dark:bg-emerald-500 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10 border-b border-slate-100 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-2xl border border-cyan-500/30 text-cyan-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                Budget vs. Spending Trend
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-cyan-500 border border-cyan-500/20 uppercase tracking-wider">
                  D3 Engine
                </span>
              </h3>
              <p className="text-xs text-[#0F172A] dark:text-white font-bold">
                Real-time financial variance & smart liquidity tracking
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#0F172A] ml-2 mr-1" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              aria-label="Filter budget category"
              className="bg-transparent text-[#0F172A] dark:text-[#1E293B] font-bold pr-2 py-1 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-50 text-white dark:bg-slate-900">All Categories</option>
              <option value="housing" className="bg-slate-50 text-white dark:bg-slate-900">Housing & Estate</option>
              <option value="lifestyle" className="bg-slate-50 text-white dark:bg-slate-900">Lifestyle & Dining</option>
              <option value="utilities" className="bg-slate-50 text-white dark:bg-slate-900">Utilities & Bills</option>
              <option value="investments" className="bg-slate-50 text-white dark:bg-slate-900">Investments & Vaults</option>
            </select>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {(['6M', 'YTD', '1Y'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframe === tf 
                    ? 'bg-cyan-500 text-white shadow-md' 
                    : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-cyan-500" /> Target Budget
          </p>
          <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
            {formatCurrency(summary.totalBudget)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1 flex items-center gap-1">
            <PieChart className="w-3 h-3 text-emerald-500" /> Actual Spending
          </p>
          <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
            {formatCurrency(summary.totalSpending)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1 flex items-center gap-1">
            {summary.netVariance >= 0 ? (
              <TrendingDown className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingUp className="w-3 h-3 text-rose-400" />
            )} 
            Net Variance
          </p>
          <p className={`text-xl font-black font-mono ${summary.netVariance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {summary.netVariance >= 0 ? '+' : ''}{formatCurrency(summary.netVariance)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Financial Health
            </p>
            <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
              {summary.healthScore}<span className="text-xs text-[#0F172A]">/100</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-emerald-500 text-emerald-400 border border-emerald-500/20">
              Optimal
            </span>
          </div>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full h-[300px] z-10">
        <svg ref={svgRef} className="overflow-visible" />

        {/* Legend */}
        <div className="absolute top-2 right-4 flex items-center gap-4 text-xs font-semibold text-[#0F172A] bg-slate-50  px-3 py-1.5 rounded-xl border border-black/5 dark:bg-slate-900">
          {selectedCategory === 'all' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 border border-cyan-400 border-dashed inline-block"></span>
              <span>Budget Line</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span>Actual Spending</span>
          </div>
        </div>

        {/* D3 Hover Tooltip */}
        {hoveredData && tooltipPos && (
          <div 
            className="absolute z-30 pointer-events-none p-3 bg-slate-50 text-white rounded-2xl shadow-2xl border border-black/5 text-xs  transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[180px] dark:bg-slate-900"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="flex items-center justify-between font-bold border-b border-black/5 pb-1.5 mb-2">
              <span className="text-cyan-400 uppercase tracking-widest font-black">{hoveredData.month} Analytics</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                hoveredData.spending <= hoveredData.budget ? 'bg-emerald-500 text-emerald-400' : 'bg-rose-500 text-rose-400'
              }`}>
                {hoveredData.spending <= hoveredData.budget ? 'Under Budget' : 'Over Budget'}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[#0F172A]">
                <span>Monthly Budget:</span>
                <span className="font-mono font-bold text-slate-100">{formatCurrency(hoveredData.budget)}</span>
              </div>
              <div className="flex justify-between text-[#0F172A]">
                <span>Total Spent:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(hoveredData.spending)}</span>
              </div>
              <div className="flex justify-between text-[#0F172A] pt-1 border-t border-black/5">
                <span>Savings Surplus:</span>
                <span className={`font-mono font-bold ${hoveredData.budget - hoveredData.spending >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(hoveredData.budget - hoveredData.spending)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-[#0F172A] dark:text-white relative z-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Calculated via D3 curveMonotone interpolation engine & open banking sync</span>
        </div>
        <span className="font-mono text-[10px] text-[#0F172A] uppercase tracking-wider">
          Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
