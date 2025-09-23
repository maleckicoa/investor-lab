import React, { useState, useRef } from 'react';

type IndexPoint = { date: string; index_value: number };
type BenchmarkPoint = { date: string; value: number };

interface IndexLineChartProps {
  data: IndexPoint[];
  benchmarkData?: { [symbol: string]: BenchmarkPoint[] };
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

const IndexLineChart: React.FC<IndexLineChartProps> = ({ data, benchmarkData, width = 800, height = 320, startValue }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; px: number; py: number; date: string; value: number; type: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /*
  // Debug logging
  console.log('🔍 IndexLineChart received data:', data);
  console.log('🔍 Benchmark data:', benchmarkData);
  console.log('🔍 Data length:', data?.length);
  console.log('🔍 Data type:', typeof data);
  if (data && data.length > 0) {
    console.log('🔍 First data point:', data[0]);
    console.log('🔍 Sample data points:', data.slice(0, 3));
  }
  */
 
  if (!data || data.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>No data to display</div>;
  }

  // Parse main index data
  const parsedIndex = data
    .filter(d => d.date && d.index_value !== null && d.index_value !== undefined)
    .map(d => ({ t: new Date(d.date).getTime(), v: Number(d.index_value), type: 'index' }))
    .sort((a, b) => a.t - b.t);

  // Parse benchmark data
  const parsedBenchmarks: { [symbol: string]: Array<{ t: number; v: number; type: string }> } = {};
  if (benchmarkData) {
    Object.entries(benchmarkData).forEach(([symbol, points]) => {
      parsedBenchmarks[symbol] = points
        .filter(d => d.date && d.value !== null && d.value !== undefined)
        .map(d => ({ t: new Date(d.date).getTime(), v: Number(d.value), type: symbol }))
        .sort((a, b) => a.t - b.t);
    });
  }

  // Combine all data for domain calculation
  const allData = [parsedIndex, ...Object.values(parsedBenchmarks)].flat();
  
  if (allData.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>No data to display</div>;
  }

  // Increase bottom padding to ensure x-axis labels are fully visible
  const padding = { top: 12, right: 60, bottom: 36, left: 40 };
  // Ensure chart is wide enough for horizontal scrolling - use a minimum width that's wider than most mobile screens
  const w = Math.max(200, width || 1000);
  const h = Math.max(160, height);
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const minX = Math.min(...allData.map(p => p.t));
  const maxX = Math.max(...allData.map(p => p.t));
  let minY = Math.min(...allData.map(p => p.v));
  let maxY = Math.max(...allData.map(p => p.v));

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

  // Generate paths for each data series
  const generatePath = (points: Array<{ t: number; v: number }>) => {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t)} ${yScale(p.v)}`)
      .join(' ');
  };

  const indexPath = generatePath(parsedIndex);
  const benchmarkPaths = Object.entries(parsedBenchmarks).map(([symbol, points]) => ({
    symbol,
    path: generatePath(points)
  }));

  // Handle mouse move to find closest point by X (date) anywhere in plot
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert mouseX back to time to find nearest by X only
    const t = minX + ((mouseX - padding.left) / (innerW)) * (maxX - minX);
    
    // Calculate interpolated value at cursor Y position
    const cursorValue = minY + ((padding.top + innerH - mouseY) / innerH) * (maxY - minY);
    
    // Find closest point across all data series for date
    let closestPoint: { t: number; v: number; type: string } | null = null;
    let minDistance = Infinity;
    
    // Check index data
    for (const point of parsedIndex) {
      const distance = Math.abs(point.t - t);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    // Check benchmark data
    Object.values(parsedBenchmarks).forEach(points => {
      for (const point of points) {
        const distance = Math.abs(point.t - t);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
    });
    
    if (closestPoint) {
      const px = xScale(closestPoint.t);
      const py = yScale(cursorValue); // Use cursor Y position for crosshair
      
      const hoverPoint = {
        x: mouseX,
        y: mouseY,
        px,
        py,
        date: new Date(closestPoint.t).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        value: cursorValue, // Use interpolated value at cursor position
        type: closestPoint.type
      };
      
      setHoveredPoint(hoverPoint);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Touch support: mirror mouse move behavior for mobile
  const handleTouchMove = (event: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    if (event.touches.length === 0) return;
    const touch = event.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const t = minX + ((touchX - padding.left) / (innerW)) * (maxX - minX);
    const cursorValue = minY + ((padding.top + innerH - touchY) / innerH) * (maxY - minY);

    let closestPoint: { t: number; v: number; type: string } | null = null;
    let minDistance = Infinity;
    for (const point of parsedIndex) {
      const distance = Math.abs(point.t - t);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    Object.values(parsedBenchmarks).forEach(points => {
      for (const point of points) {
        const distance = Math.abs(point.t - t);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
    });

    if (closestPoint) {
      const px = xScale(closestPoint.t);
      const py = yScale(cursorValue);
      setHoveredPoint({
        x: touchX,
        y: touchY,
        px,
        py,
        date: new Date(closestPoint.t).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        value: cursorValue,
        type: closestPoint.type
      });
    }
  };

  const handleTouchEnd = () => {
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
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair', touchAction: 'pan-x' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={w} height={h} fill="#ffffff" />

      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#e5e7eb" />
      {/* Removed the bottom horizontal axis line to avoid overlapping the x-axis labels */}

      {/* Y ticks and labels */}
      {yTicks.map((tv, i) => {
        const y = yScale(tv);
        return (
          <g key={i}>
            <line x1={padding.left - 4} y1={y} x2={padding.left + innerW} y2={y} stroke="#f3f4f6" />
            <text x={padding.left - 8} y={y} textAnchor="end" alignmentBaseline="middle" fill="#6b7280" style={{ fontSize: '0.625rem' }}>
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
            <text x={x} y={padding.top + innerH + 22} textAnchor="middle" alignmentBaseline="hanging" fill="#6b7280" style={{ fontSize: '0.625rem' }}>
              {dateStr}
            </text>
          </g>
        );
      })}

      {/* Lines */}
      {/* Main index line - blue and thicker */}
      <path d={indexPath} fill="none" stroke="#2563eb" strokeWidth={3} />
      
      {/* Benchmark lines */}
      {benchmarkPaths.map(({ symbol, path }, index) => {
        const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
        const color = colors[index % colors.length];
        return (
          <path 
            key={symbol} 
            d={path} 
            fill="none" 
            stroke={color} 
            strokeWidth={1.5}
          />
        );
      })}

      {/* Hover guideline and point */}
      {hoveredPoint && (
        <g>
          {/* Vertical guideline */}
          <line x1={hoveredPoint.px} y1={padding.top} x2={hoveredPoint.px} y2={padding.top + innerH} stroke="#d1d5db" strokeDasharray="4 4" />
          {/* Horizontal guideline */}
          <line x1={padding.left} y1={hoveredPoint.py} x2={padding.left + innerW} y2={hoveredPoint.py} stroke="#d1d5db" strokeDasharray="4 4" />
          {/* Highlighted point */}
          <circle cx={hoveredPoint.px} cy={hoveredPoint.py} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth={1} />
        </g>
      )}

      {/* Last point markers */}
      {parsedIndex.length > 0 && (
        <circle cx={xScale(parsedIndex[parsedIndex.length - 1].t)} cy={yScale(parsedIndex[parsedIndex.length - 1].v)} r={3} fill="#2563eb" />
      )}
      {Object.entries(parsedBenchmarks).map(([symbol, points], index) => {
        if (points.length > 0) {
          const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
          const color = colors[index % colors.length];
          return (
            <circle 
              key={`marker-${symbol}`}
              cx={xScale(points[points.length - 1].t)} 
              cy={yScale(points[points.length - 1].v)} 
              r={3} 
              fill={color} 
            />
          );
        }
        return null;
      })}
      
      {/* Legend inside SVG */}
      <g>
        {/* Calculate total legend width to center it */}
        {(() => {
          const totalItems = 1 + benchmarkPaths.length; // Index + benchmarks
          const itemWidth = 80; // Width per item
          const totalWidth = totalItems * itemWidth;
          const startX = w/2 - totalWidth/2;
          
          return (
            <>
              {/* Index line legend */}
              <line
                x1={startX}
                y1={padding.top + 20}
                x2={startX + 20}
                y2={padding.top + 20}
                stroke="#2563eb"
                strokeWidth="3"
              />
              <text
                x={startX + 25}
                y={padding.top + 25}
                fontSize="12"
                fill="#6b7280"
              >
                Index
              </text>
              
              {/* Benchmark lines legend */}
              {benchmarkPaths.map(({ symbol }, index) => {
                const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
                const color = colors[index % colors.length];
                const legendX = startX + 80 + (index * 80);
                
                return (
                  <g key={`legend-${symbol}`}>
                    <line
                      x1={legendX}
                      y1={padding.top + 20}
                      x2={legendX + 15}
                      y2={padding.top + 20}
                      stroke={color}
                      strokeWidth="2"
                    />
                    <text
                      x={legendX + 20}
                      y={padding.top + 25}
                      fontSize="12"
                      fill="#6b7280"
                    >
                      {symbol}
                    </text>
                  </g>
                );
              })}
            </>
          );
        })()}
      </g>
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
          padding: '0.375rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{hoveredPoint.date}</div>
        <div>
          Value: {hoveredPoint.value.toLocaleString()}
        </div>
      </div>
    )}
    </div>
  );
};

export default IndexLineChart;


