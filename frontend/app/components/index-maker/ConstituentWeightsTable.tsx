import React from 'react';

type WeightsDict = {
  [year: string]: {
    [quarter: string]: Array<{ symbol: string; weight: number }>;
  };
};

interface ConstituentWeightsTableProps {
  weights: WeightsDict | Record<string, any>;
}

const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];

function sortPeriods(weights: WeightsDict): Array<{ year: string; quarter: string }> {
  const periods: Array<{ year: string; quarter: string }> = [];
  Object.keys(weights || {}).forEach((year) => {
    const qs = Object.keys(weights[year] || {});
    qs.forEach((q) => periods.push({ year, quarter: q }));
  });
  return periods.sort((a, b) => {
    const ay = Number(a.year);
    const by = Number(b.year);
    if (ay !== by) return ay - by;
    const ai = QUARTER_ORDER.indexOf(a.quarter as string);
    const bi = QUARTER_ORDER.indexOf(b.quarter as string);
    return ai - bi;
  });
}

const ConstituentWeightsTable: React.FC<ConstituentWeightsTableProps> = ({ weights }) => {
  const typed = (weights || {}) as WeightsDict;
  const periods = sortPeriods(typed);
  if (periods.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: '12px' }}>No constituent weights available.</div>
    );
  }

  // Collect all symbols across periods
  const allSymbolsSet = new Set<string>();
  periods.forEach(({ year, quarter }) => {
    (typed[year]?.[quarter] || []).forEach(({ symbol }) => allSymbolsSet.add(symbol));
  });
  const allSymbols = Array.from(allSymbolsSet);

  // Sort rows by weight in the latest period (desc)
  const latest = periods[periods.length - 1];
  const latestMap = new Map<string, number>((typed[latest.year]?.[latest.quarter] || []).map(p => [p.symbol, p.weight]));
  allSymbols.sort((a, b) => (latestMap.get(b) || 0) - (latestMap.get(a) || 0));

  // Helper to get weight for cell
  const getWeight = (symbol: string, year: string, quarter: string): number | null => {
    const arr = typed[year]?.[quarter] || [];
    const found = arr.find((x) => x.symbol === symbol);
    return found ? found.weight : null;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
        <thead>
          <tr>
            <th style={{
              position: 'sticky', left: 0, background: '#ffffff', zIndex: 1,
              textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600
            }}>Constituent</th>
            {periods.map(({ year, quarter }, idx) => (
              <th key={idx} style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>
                {year} {quarter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allSymbols.map((symbol, r) => (
            <tr key={symbol} style={{ backgroundColor: r % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
              <td style={{
                position: 'sticky', left: 0, background: r % 2 === 0 ? '#ffffff' : '#f9fafb', zIndex: 1,
                padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#111827', fontWeight: 500
              }}>{symbol}</td>
              {periods.map(({ year, quarter }, c) => {
                const w = getWeight(symbol, year, quarter);
                return (
                  <td key={c} style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#111827' }}>
                    {w !== null ? `${(w * 100).toFixed(2)}%` : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConstituentWeightsTable;


