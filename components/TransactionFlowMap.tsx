import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TransactionFlowMapProps {
    status: 'pending' | 'clearing' | 'security' | 'completed' | 'halted';
    nodes?: string[];
}

export const TransactionFlowMap: React.FC<TransactionFlowMapProps> = ({ status, nodes = ['Origin', 'AML Check', 'Federal Reserve', 'SWIFT Network', 'Destination'] }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || 600;
        const height = 150;
        
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const nodeRadius = 12;
        const spacing = width / (nodes.length + 1);

        // Determine active index based on status
        let activeIndex = 0;
        switch (status) {
            case 'pending': activeIndex = 0; break;
            case 'security': activeIndex = 1; break;
            case 'clearing': activeIndex = 3; break;
            case 'completed': activeIndex = nodes.length - 1; break;
            case 'halted': activeIndex = 1; break;
            default: activeIndex = 0;
        }

        // Draw links
        const linkGenerator = d3.linkHorizontal()
            .x(d => (d as any).x)
            .y(d => (d as any).y);

        for (let i = 0; i < nodes.length - 1; i++) {
            const isCompleted = i < activeIndex;
            const source = { x: spacing * (i + 1), y: height / 2 };
            const target = { x: spacing * (i + 2), y: height / 2 };
            
            // Background line
            svg.append('path')
                .attr('d', linkGenerator({ source: source, target: target } as any))
                .attr('fill', 'none')
                .attr('stroke', '#334155')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4');

            // Active path overlay
            if (isCompleted) {
                const path = svg.append('path')
                    .attr('d', linkGenerator({ source: source, target: target } as any))
                    .attr('fill', 'none')
                    .attr('stroke', '#0ec5f2')
                    .attr('stroke-width', 3);
                
                const length = (path.node() as SVGPathElement).getTotalLength();
                path.attr('stroke-dasharray', length)
                    .attr('stroke-dashoffset', length)
                    .transition()
                    .duration(1000)
                    .attr('stroke-dashoffset', 0);
            }
        }

        // Draw nodes
        const nodeGroups = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', (d, i) => `translate(${spacing * (i + 1)}, ${height / 2})`);

        nodeGroups.append('circle')
            .attr('r', nodeRadius)
            .attr('fill', (d, i) => {
                if (i < activeIndex) return '#0ec5f2';
                if (i === activeIndex && status === 'halted') return '#ef4444';
                if (i === activeIndex) return '#0ec5f2';
                return '#1e293b';
            })
            .attr('stroke', (d, i) => i <= activeIndex ? '#ffffff' : '#334155')
            .attr('stroke-width', 2);

        // Add pulsing effect to active node
        nodeGroups.filter((d, i) => i === activeIndex)
            .append('circle')
            .attr('r', nodeRadius)
            .attr('fill', 'none')
            .attr('stroke', status === 'halted' ? '#ef4444' : '#0ec5f2')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8)
            .style('animation', 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite');

        // Text labels
        nodeGroups.append('text')
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', (d, i) => i <= activeIndex ? '#f8fafc' : '#64748b')
            .attr('font-size', '10px')
            .attr('font-family', 'sans-serif')
            .attr('font-weight', 'bold')
            .attr('text-transform', 'uppercase')
            .attr('letter-spacing', '0.1em')
            .text(d => d);

    }, [status, nodes]);

    return (
        <div className="w-full relative overflow-hidden bg-slate-50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 dark:bg-slate-900">
            <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest absolute top-4 left-4">International Flow Clearance</h4>
            <svg ref={svgRef} className="w-full h-[150px]"></svg>
            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};
