import React from 'react';

type WeightRow = {
  year: number;
  quarter: string;
  symbol: string;
  company_name: string;
  country: string;
  weight: number;
};

type WeightsDict = {
  [year: string]: {
    [quarter: string]: Array<{ symbol: string; weight: number }>;
  };
};

interface ConstituentWeightsTableProps {
  weights: WeightRow[] | WeightsDict | Record<string, any>;
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
  // Check if weights is an array (new format) or object (old format)
  const isArrayFormat = Array.isArray(weights);
  
  if (isArrayFormat) {
    // Handle new array format - show each quarter as a separate section
    const weightRows = weights as WeightRow[];
    
    if (!weightRows || !Array.isArray(weightRows) || weightRows.length === 0) {
      return (
        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>No constituent weights available.</div>
      );
    }

    // Group by year and quarter
    const groupedWeights: { [key: string]: WeightRow[] } = {};
    weightRows.forEach(row => {
      const key = `${row.year}-${row.quarter}`;
      if (!groupedWeights[key]) {
        groupedWeights[key] = [];
      }
      groupedWeights[key].push(row);
    });

    // Sort quarters chronologically (latest first, oldest last)
    const quarters = Object.keys(groupedWeights).sort((a, b) => {
      const [yearA, quarterA] = a.split('-');
      const [yearB, quarterB] = b.split('-');
      const yearDiff = parseInt(yearB) - parseInt(yearA); // Reverse year order (newest first)
      if (yearDiff !== 0) return yearDiff;
      const quarterOrder = ['Q4', 'Q3', 'Q2', 'Q1']; // Reverse quarter order (Q4 first)
      return quarterOrder.indexOf(quarterA) - quarterOrder.indexOf(quarterB);
    });

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {quarters.map((quarterKey, idx) => {
          const [year, quarter] = quarterKey.split('-');
          const companies = groupedWeights[quarterKey].sort((a, b) => b.weight - a.weight);
          
          return (
            <div key={quarterKey} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              overflow: 'hidden',
              backgroundColor: 'white',
              minWidth: '12.5rem',
              maxWidth: '15.625rem',
              flexShrink: 0
            }}>
              <div style={{ 
                padding: '0.5rem 0.75rem', 
                backgroundColor: '#f9fafb', 
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.75rem'
              }}>
                {year} {quarter} ({companies.length})
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '0.375rem 0.5rem', 
                        borderBottom: '1px solid #e5e7eb', 
                        color: '#374151', 
                        fontWeight: 600,
                        backgroundColor: '#f9fafb',
                        fontSize: '0.6875rem'
                      }}>Company</th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '0.375rem 0.5rem', 
                        borderBottom: '1px solid #e5e7eb', 
                        color: '#374151', 
                        fontWeight: 600,
                        backgroundColor: '#f9fafb',
                        fontSize: '0.6875rem'
                      }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company, r) => (
                      <tr key={company.symbol} style={{ 
                        backgroundColor: r % 2 === 0 ? '#ffffff' : '#f9fafb' 
                      }}>
                        <td style={{ 
                          padding: '0.375rem 0.5rem', 
                          borderBottom: '1px solid #f3f4f6', 
                          color: '#111827',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            marginBottom: '0.125rem',
                            fontSize: '0.6875rem',
                            lineHeight: '1.2'
                          }}>
                            {company.company_name}
                          </div>
                          <div style={{ 
                            fontSize: '0.5625rem', 
                            color: '#6b7280',
                            lineHeight: '1.1',
                            marginBottom: '0.0625rem'
                          }}>
                            {company.symbol}
                          </div>
                          <div style={{ 
                            fontSize: '0.5rem', 
                            color: '#9ca3af',
                            lineHeight: '1.1'
                          }}>
                            {company.country}
                          </div>
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '0.375rem 0.5rem', 
                          borderBottom: '1px solid #f3f4f6', 
                          color: '#111827',
                          fontWeight: '500',
                          fontSize: '0.625rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {(company.weight * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Handle old object format (fallback) or invalid data
  if (!weights) {
    return (
      <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>No constituent weights available.</div>
    );
  }
  
  const typed = (weights || {}) as WeightsDict;
  const periods = sortPeriods(typed);
  if (periods.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>No constituent weights available.</div>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '45rem' }}>
        <thead>
          <tr>
            <th style={{
              position: 'sticky', left: 0, background: '#ffffff', zIndex: 1,
              textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600
            }}>Constituent</th>
            {periods.map(({ year, quarter }, idx) => (
              <th key={idx} style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>
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
                padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', color: '#111827', fontWeight: 500
              }}>{symbol}</td>
              {periods.map(({ year, quarter }, c) => {
                const w = getWeight(symbol, year, quarter);
                return (
                  <td key={c} style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', color: '#111827' }}>
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


