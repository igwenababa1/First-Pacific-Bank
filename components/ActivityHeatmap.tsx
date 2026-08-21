import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Transaction, TransactionStatus } from '../types';

interface ActivityHeatmapProps {
    transactions: Transaction[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ transactions }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!svgRef.current || !transactions || transactions.length === 0) return;

        // Process data: aggregate transaction counts by hour of day and day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hours = d3.range(24);

        const data = Array.from({ length: 7 }, () => Array(24).fill(0));

        transactions.forEach(tx => {
            const dateStr = tx.statusTimestamps[TransactionStatus.COMPLETED] || tx.statusTimestamps[TransactionStatus.SUBMITTED] || tx.estimatedArrival;
            if (!dateStr) return;
            const d = new Date(dateStr);
            const day = d.getDay();
            const hour = d.getHours();
            data[day][hour]++;
        });

        // Flatten data for D3
        const flattenedData: { day: number; hour: number; value: number }[] = [];
        data.forEach((dayArr, dayIdx) => {
            dayArr.forEach((val, hourIdx) => {
                flattenedData.push({ day: dayIdx, hour: hourIdx, value: val });
            });
        });

        const margin = { top: 30, right: 30, bottom: 40, left: 50 };
        const width = svgRef.current.parentElement?.clientWidth || 800 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Clear previous render
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(hours.map(String))
            .padding(0.05);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `${d}h`))
            .select(".domain").remove();

        svg.selectAll(".tick text")
            .attr("fill", "#64748b")
            .attr("font-size", "10px");

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(days)
            .padding(0.05);

        svg.append("g")
            .call(d3.axisLeft(y))
            .select(".domain").remove();

        svg.selectAll(".tick text")
            .attr("fill", "#64748b")
            .attr("font-size", "10px")
            .attr("font-weight", "bold");

        // Color scale
        const maxVal = d3.max(flattenedData, d => d.value) || 1;
        const color = d3.scaleSequential()
            .interpolator(d3.interpolatePuBuGn)
            .domain([0, maxVal]);

        // Tooltip
        const tooltip = d3.select(svgRef.current.parentElement)
            .append("div")
            .style("opacity", 0)
            .attr("class", "absolute bg-slate-50 border border-slate-300 text-white p-2 rounded text-xs pointer-events-none transition-opacity duration-200 z-10");

        svg.selectAll()
            .data(flattenedData)
            .enter()
            .append("rect")
            .attr("x", d => x(String(d.hour)) || 0)
            .attr("y", d => y(days[d.day]) || 0)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => d.value > 0 ? color(d.value) : "#1e293b")
            .style("stroke-width", 1)
            .style("stroke", "#0f172a")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("stroke", "#38bdf8")
                    .style("stroke-width", 2);
                tooltip.style("opacity", 1)
                    .html(`${days[d.day]} ${d.hour}:00<br/>Transactions: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", "#0f172a")
                    .style("stroke-width", 1);
                tooltip.style("opacity", 0);
            });

        // Cleanup tooltip on unmount
        return () => {
            tooltip.remove();
        };
    }, [transactions]);

    return (
        <div className="w-full relative overflow-x-auto min-h-[300px]">
            <svg ref={svgRef} className="w-full h-full min-w-[700px]"></svg>
        </div>
    );
};
