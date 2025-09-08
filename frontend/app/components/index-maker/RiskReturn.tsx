import React, { useMemo, useState } from 'react';

type BenchmarkRR = {
  name: string;
  symbol: string;
  type?: string;
  return_eur?: number | string | null;
  return_usd?: number | string | null;
  risk_eur?: number | string | null;
  risk_usd?: number | string | null;
};

interface RiskReturnProps {
  data: BenchmarkRR[];
  currency: 'USD' | 'EUR';
  width?: number;
  height?: number;
  // zoom = 1 shows all points; zoom = 5 zooms in 5x
  zoom?: number;
  // Optional point for the user's created index
  indexPoint?: { x: number; y: number; name: string; symbol: string } | null;
}

const RiskReturn: React.FC<RiskReturnProps> = ({ data, currency, width = 320, height = 220, zoom = 1, indexPoint = null }) => {
  const padding = { top: 28, right: 20, bottom: 50, left: 56 };

  const retKey = currency === 'EUR' ? 'return_eur' : 'return_usd';
  const riskKey = currency === 'EUR' ? 'risk_eur' : 'risk_usd';

  const basePoints = useMemo(() => ((data || [])
    .map((b) => ({
      name: b.name,
      symbol: b.symbol,
      x: b[riskKey] !== undefined && b[riskKey] !== null ? Number(b[riskKey] as any) : null,
      y: b[retKey] !== undefined && b[retKey] !== null ? Number(b[retKey] as any) : null,
      isIndex: false,
    }))
    .filter((p) => typeof p.x === 'number' && isFinite(p.x as number) && typeof p.y === 'number' && isFinite(p.y as number)) as Array<{
      name: string;
      symbol: string;
      x: number;
      y: number;
      isIndex: boolean;
    }>), [data, retKey, riskKey]);

  const points = useMemo(() => {
    const list = [...basePoints];
    if (indexPoint && isFinite(indexPoint.x) && isFinite(indexPoint.y)) {
      list.push({ name: indexPoint.name, symbol: indexPoint.symbol, x: indexPoint.x, y: indexPoint.y, isIndex: true });
    }
    return list;
  }, [basePoints, indexPoint]);

  if (points.length === 0) {
    return <div style={{ fontSize: 12, color: '#6b7280' }}>No risk/return data</div>;
  }

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  // add small margins
  const spanX = maxX - minX || 0.1;
  const spanY = maxY - minY || 0.1;
  // Ensure X axis starts at 0%
  const baseMinX = Math.min(0, minX - spanX * 0.05);
  const baseMaxX = maxX + spanX * 0.05;
  // Ensure Y axis starts at -20% but don't add extra margin below data
  const baseMinY = Math.min(-0.2, minY - spanY * 0.02);
  const baseMaxY = maxY + spanY * 0.05;

  // PIXEL ZOOM: keep the data domain fixed to base (fit-all) and scale the canvas.
  const z = Math.max(0.2, Math.min(5, Number.isFinite(zoom) ? (zoom as number) : 1));
  const svgW = Math.round(width * z);
  const svgH = Math.round(height * z);
  const innerW = svgW - padding.left - padding.right;
  const innerH = svgH - padding.top - padding.bottom;
  const domMinX = baseMinX;
  const domMaxX = baseMaxX;
  const domMinY = baseMinY;
  const domMaxY = baseMaxY;

  const xScale = (v: number) => padding.left + ((v - domMinX) / (domMaxX - domMinX || 1)) * innerW;
  const yScale = (v: number) => padding.top + innerH - ((v - domMinY) / (domMaxY - domMinY || 1)) * innerH;
  const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const clipId = `rr-basic-${Math.random().toString(36).slice(2)}`;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />
      <defs>
        <clipPath id={clipId}>
          <rect x={padding.left} y={padding.top} width={innerW} height={innerH} />
        </clipPath>
      </defs>

      {/* axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#e5e7eb" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#e5e7eb" />

      {/* ticks */}
      {(() => {
        const ticks: number[] = [];
        const step = 0.2; // 20%
        // Start at -20% and go up in 20% increments
        const minTick = -0.2;
        const maxTick = Math.ceil(domMaxY / step) * step;
        for (let v = minTick; v <= maxTick + 1e-9; v += step) {
          if (v + 1e-9 >= domMinY && v - 1e-9 <= domMaxY) {
            ticks.push(Number(v.toFixed(6)));
          }
        }
        return ticks.map((v, i) => {
          const y = yScale(v);
          return (
            <g key={`yt-${i}`}>
              <line x1={padding.left} y1={y} x2={padding.left + innerW} y2={y} stroke="#f3f4f6" />
              <text x={padding.left - 10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize={11} fill="#6b7280">{`${Math.round(v * 100)}%`}</text>
            </g>
          );
        });
      })()}
      {(() => {
        const ticks: number[] = [];
        const step = 0.05; // 5%
        const maxTick = Math.ceil(domMaxX / step) * step;
        for (let v = 0; v <= maxTick + 1e-9; v += step) {
          if (v + 1e-9 >= domMinX && v - 1e-9 <= domMaxX) {
            ticks.push(Number(v.toFixed(6)));
          }
        }
        return ticks.map((v, i) => {
          const x = xScale(v);
          return (
            <g key={`xt-${i}`}>
              <line x1={x} y1={padding.top + innerH} x2={x} y2={padding.top + innerH + 4} stroke="#e5e7eb" />
              <text x={x} y={padding.top + innerH + 18} textAnchor="middle" alignmentBaseline="hanging" fontSize={11} fill="#6b7280">{`${Math.round(v * 100)}%`}</text>
            </g>
          );
        });
      })()}

      {/* points */}
      <g clipPath={`url(#${clipId})`}>
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g key={p.symbol}>
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r={p.isIndex ? 6 : 3}
                fill={p.isIndex ? '#ff6b35' : (isHovered ? '#93c5fd' : '#2563eb')}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </g>

      {/* hover tooltip */}
      {hoveredIdx !== null && (() => {
        const p = points[hoveredIdx];
        const px = xScale(p.x);
        const py = yScale(p.y);

        const fontSize = 9;
        const approxCharWidth = 5.5; // px per char at fontSize 9
        const lineH = 11;
        const boxW = 200; // fixed tooltip width for predictable wrapping

        const maxCharsPerLine = Math.max(8, Math.floor((boxW - 12) / approxCharWidth));
        const wrapText = (text: string): string[] => {
          const words = (text || '').split(' ');
          const linesArr: string[] = [];
          let current = '';
          for (const w of words) {
            if ((current + (current ? ' ' : '') + w).length <= maxCharsPerLine) {
              current = current ? current + ' ' + w : w;
            } else {
              if (current) linesArr.push(current);
              // if a single word is too long, hard-split
              if (w.length > maxCharsPerLine) {
                for (let i = 0; i < w.length; i += maxCharsPerLine) {
                  linesArr.push(w.slice(i, i + maxCharsPerLine));
                }
                current = '';
              } else {
                current = w;
              }
            }
          }
          if (current) linesArr.push(current);
          return linesArr;
        };

        const nameLines = wrapText(p.name);
        const symbolLines = wrapText(`Symbol: ${p.symbol}`);
        const detailLines = [
          `Return: ${(p.y * 100).toFixed(1)}%`,
          `Risk: ${(p.x * 100).toFixed(1)}%`,
        ];
        const lines = [...nameLines, ...symbolLines, ...detailLines];
        const boxH = lines.length * lineH + 8;

        let tx = px + 8;
        let ty = py - boxH - 8;
        if (tx + boxW > padding.left + innerW) tx = px - boxW - 8;
        if (ty < padding.top) ty = py + 8;

        return (
          <g>
            <rect x={tx} y={ty} width={boxW} height={boxH} rx={4} ry={4} fill="#111827" opacity={0.9} />
            <text x={tx + 6} y={ty + 6 + lineH * 0.75} fontSize={fontSize} fill="#ffffff">
              {lines.map((l, idx) => (
                <tspan key={idx} x={tx + 6} y={ty + 6 + lineH * (idx + 0.75)}>
                  {l}
                </tspan>
              ))}
            </text>
          </g>
        );
      })()}

      {/* labels */}
      <text x={padding.left + innerW / 2} y={svgH - 6} textAnchor="middle" fontSize={12} fill="#374151">Risk ({currency})</text>
      <text x={16} y={padding.top - 10} textAnchor="start" fontSize={12} fill="#374151">Return ({currency})</text>
    </svg>
  );
};

export default RiskReturn;


export function RiskReturnZoomSlider({ value, onChange, width = 140 }: { value: number; onChange: (n: number) => void; width?: number }) {
  return (
    <input
      type="range"
      min={0.2}
      max={5}
      step={0.1}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: `${width}px`,
        height: '6px',
        borderRadius: '3px',
        background: '#dbeafe',
        outline: 'none',
        cursor: 'pointer',
        WebkitAppearance: 'none',
        appearance: 'none'
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLInputElement).style.background = '#2563eb';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLInputElement).style.background = '#dbeafe';
      }}
    />
  );
}

