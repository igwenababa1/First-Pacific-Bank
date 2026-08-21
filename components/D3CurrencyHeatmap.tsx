import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CryptoAsset } from '../types';

interface D3CurrencyHeatmapProps {
    assets: CryptoAsset[];
}

export const D3CurrencyHeatmap: React.FC<D3CurrencyHeatmapProps> = ({ assets }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height: Math.max(300, height) });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!assets || assets.length === 0 || dimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const data = assets.slice(0, 16); // take top 16 assets for a 4x4 grid representation roughly

        // Create a basic Treemap structure
        // Since we want a flat hierarchy, we wrap it in a root node
        const hierarchyData = {
            name: "root",
            children: data.map(asset => ({
                name: asset.symbol,
                fullName: asset.name,
                value: asset.marketCap || (Math.random() * 1000000000) + 10000000, // simulated market cap if missing
                change: asset.change24h
            }))
        };

        const root = d3.hierarchy(hierarchyData)
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => b.value - a.value);

        const treemapRoot = d3.treemap<any>()
            .size([dimensions.width, dimensions.height])
            .padding(4)
            .round(true)(root);

        const nodes = svg.selectAll('g')
            .data(treemapRoot.leaves())
            .join('g')
            .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

        // Color scale
        const colorScale = d3.scaleLinear<string>()
            .domain([-10, 0, 10])
            .range(["#ef4444", "#334155", "#10b981"]);

        nodes.append('rect')
            .attr('width', (d: any) => d.x1 - d.x0)
            .attr('height', (d: any) => d.y1 - d.y0)
            .attr('fill', (d: any) => colorScale(d.data.change))
            .attr('rx', 8)
            .attr('ry', 8)
            .style('stroke', '#ffffff10')
            .style('stroke-width', 1)
            .style('transition', 'fill 0.3s ease');

        nodes.append('text')
            .attr('x', 12)
            .attr('y', 24)
            .text((d: any) => d.data.name)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .attr('font-family', 'monospace');

        nodes.append('text')
            .attr('x', 12)
            .attr('y', 42)
            .text((d: any) => `${d.data.change > 0 ? '+' : ''}${d.data.change.toFixed(2)}%`)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'rgba(255,255,255,0.8)')
            .attr('font-family', 'monospace');
            
        // Optional value formatting
        nodes.append('text')
            .attr('x', 12)
            .attr('y', 60)
            .text((d: any) => {
                const w = d.x1 - d.x0;
                const h = d.y1 - d.y0;
                if (w < 80 || h < 70) return '';
                return `$${(d.data.value / 1e9).toFixed(1)}B`;
            })
            .attr('font-size', '10px')
            .attr('fill', 'rgba(255,255,255,0.5)')
            .attr('font-family', 'Inter');

    }, [assets, dimensions]);

    return (
        <div className="w-full h-full flex flex-col pt-2 pb-2">
            <div className="flex justify-between items-center mb-6 px-2">
                <div>
                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A] mb-1">D3.js Visualization Engine</h3>
                     <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Global Volatility Heatmap</h4>
                </div>
                <div className="flex gap-2">
                     <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                     <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                     <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
            </div>
            
            <div ref={containerRef} className="flex-1 w-full min-h-[300px]">
                <svg ref={svgRef} width="100%" height={dimensions.height} className="rounded-xl" />
            </div>
        </div>
    );
};
