import React, { useState, useRef } from 'react';

type IndexPoint = { date: string; index_value: number };

interface IndexLineChartProps {
  data: IndexPoint[];
  width?: number;
  height?: number;
  startValue?: number; // optional: ensures Y axis includes and shows this value
}

// Utility to compute a "nice" tick step similar to d3.nice
function niceStep(span: number, maxTicks: number): number {
  if (span <= 0 || !isFinite(span)) return 1;
  const rough = span / Math.max(1, maxTicks);
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / pow10;
  let nice;
  if (r <= 1) nice = 1;
  else if (r <= 2) nice = 2;
  else if (r <= 5) nice = 5;
  else nice = 10;
  return nice * pow10;
}

const IndexLineChart: React.FC<IndexLineChartProps> = ({ data, width = 800, height = 320, startValue }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; px: number; py: number; date: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div style={{ fontSize: '12px', color: '#6b7280' }}>No data to display</div>;
  }

  // Parse dates and values
  const parsed = data
    .filter(d => d.date && d.index_value !== null && d.index_value !== undefined)
    .map(d => ({ t: new Date(d.date).getTime(), v: Number(d.index_value) }))
    .sort((a, b) => a.t - b.t);

  if (parsed.length === 0) {
    return <div style={{ fontSize: '12px', color: '#6b7280' }}>No data to display</div>;
  }

  const padding = { top: 12, right: 60, bottom: 24, left: 40 };
  const w = Math.max(200, width);
  const h = Math.max(160, height);
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const minX = parsed[0].t;
  const maxX = parsed[parsed.length - 1].t;
  let minY = Math.min(...parsed.map(p => p.v));
  let maxY = Math.max(...parsed.map(p => p.v));

  // Ensure the provided startValue is included in the domain
  if (typeof startValue === 'number' && isFinite(startValue)) {
    minY = Math.min(minY, startValue);
    maxY = Math.max(maxY, startValue);
  }

  const xScale = (t: number) => {
    if (maxX === minX) return padding.left + innerW / 2;
    return padding.left + ((t - minX) / (maxX - minX)) * innerW;
  };
  const yScale = (v: number) => {
    const yRange = maxY === minY ? 1 : (maxY - minY);
    return padding.top + innerH - ((v - minY) / yRange) * innerH;
  };

  const pathD = parsed
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t)} ${yScale(p.v)}`)
    .join(' ');

  // Handle mouse move to find closest point by X (date) anywhere in plot
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert mouseX back to time to find nearest by X only
    const t = minX + ((mouseX - padding.left) / (innerW)) * (maxX - minX);
    // Binary search for nearest index by time
    let lo = 0;
    let hi = parsed.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (parsed[mid].t < t) lo = mid + 1; else hi = mid;
    }
    let idx = lo;
    // Compare with previous to choose closest
    if (idx > 0 && Math.abs(parsed[idx - 1].t - t) < Math.abs(parsed[idx].t - t)) idx = idx - 1;
    const p = parsed[idx];
    const px = xScale(p.t);
    const py = yScale(p.v);
    const closestPoint = {
      x: mouseX,
      y: mouseY,
      px,
      py,
      date: new Date(p.t).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      value: p.v
    };
    
    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Build y-axis ticks as nice rounded values and always include startValue if given
  const desiredTicks = 4;
  const span = maxY - minY;
  const step = niceStep(span, desiredTicks);
  const niceMin = Math.floor(minY / step) * step;
  const niceMax = Math.ceil(maxY / step) * step;
  let yTicks: number[] = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) {
    yTicks.push(v);
  }
  if (typeof startValue === 'number' && isFinite(startValue)) {
    const hasStart = yTicks.some(t => Math.abs(t - startValue!) < step / 10);
    if (!hasStart) {
      yTicks.push(startValue);
      yTicks.sort((a, b) => a - b);
    }
  }

  // Build x-axis ticks (dates) - always show 10 values, 1st of the month
  const startDate = new Date(minX);
  const endDate = new Date(maxX);
  
  // Calculate the total time span in months
  const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
  
  // Calculate the step size to get approximately 10 ticks
  const stepMonths = Math.max(1, Math.ceil(totalMonths / 9)); // 9 intervals = 10 ticks
  
  // Find the first 1st of the month at or after start date
  const firstTickDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  if (startDate.getDate() > 1) {
    firstTickDate.setMonth(firstTickDate.getMonth() + 1);
  }
  
  const xTicks: number[] = [];
  const currentTick = new Date(firstTickDate);
  
  while (currentTick <= endDate && xTicks.length < 10) {
    xTicks.push(currentTick.getTime());
    currentTick.setMonth(currentTick.getMonth() + stepMonths);
  }
  
  // If we have no ticks or only one tick, add the start and end dates
  if (xTicks.length <= 1) {
    xTicks.length = 0; // Clear array
    xTicks.push(minX, maxX);
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg 
        ref={svgRef}
        width={w} 
        height={h} 
        viewBox={`0 0 ${w} ${h}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={w} height={h} fill="#ffffff" />

      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#e5e7eb" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#e5e7eb" />

      {/* Y ticks and labels */}
      {yTicks.map((tv, i) => {
        const y = yScale(tv);
        return (
          <g key={i}>
            <line x1={padding.left - 4} y1={y} x2={padding.left + innerW} y2={y} stroke="#f3f4f6" />
            <text x={padding.left - 8} y={y} textAnchor="end" alignmentBaseline="middle" fill="#6b7280" fontSize={10}>
              {Math.round(tv).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* X ticks and labels (dates) */}
      {xTicks.map((t, i) => {
        const x = xScale(t);
        const date = new Date(t);
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
        return (
          <g key={i}>
            <line x1={x} y1={padding.top + innerH} x2={x} y2={padding.top + innerH + 4} stroke="#e5e7eb" />
            <text x={x} y={padding.top + innerH + 16} textAnchor="middle" alignmentBaseline="hanging" fill="#6b7280" fontSize={10}>
              {dateStr}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={2} />

      {/* Hover guideline and point */}
      {hoveredPoint && (
        <g>
          {/* Vertical guideline */}
          <line x1={hoveredPoint.px} y1={padding.top} x2={hoveredPoint.px} y2={padding.top + innerH} stroke="#d1d5db" strokeDasharray="4 4" />
          {/* Highlighted point */}
          <circle cx={hoveredPoint.px} cy={hoveredPoint.py} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth={1} />
        </g>
      )}

      {/* Last point marker */}
      {parsed.length > 0 && (
        <circle cx={xScale(parsed[parsed.length - 1].t)} cy={yScale(parsed[parsed.length - 1].v)} r={3} fill="#2563eb" />
      )}
    </svg>

    {/* Tooltip */}
    {hoveredPoint && (
      <div
        style={{
          position: 'absolute',
          left: Math.max(8, hoveredPoint.x - 170),
          top: Math.max(8, hoveredPoint.y - 10),
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '6px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{hoveredPoint.date}</div>
        <div>Index: {hoveredPoint.value.toLocaleString()}</div>
      </div>
    )}
    </div>
  );
};

export default IndexLineChart;


