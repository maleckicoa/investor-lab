import React, { useRef, useEffect } from 'react';
import RiskReturn, { RiskReturnZoomSlider } from './RiskReturn';

interface RiskReturnSectionProps {
  riskReturnData: any[];
  indexCurrency: 'USD' | 'EUR';
  riskReturnZoom: number;
  setRiskReturnZoom: (zoom: number) => void;
  indexRiskReturn: { risk: number; return: number } | null;
}

const RiskReturnSection: React.FC<RiskReturnSectionProps> = ({
  riskReturnData,
  indexCurrency,
  riskReturnZoom,
  setRiskReturnZoom,
  indexRiskReturn,
}) => {
  const riskReturnContainerRef = useRef<HTMLDivElement>(null);

  // Set initial scroll position to bottom on load and data/currency change
  useEffect(() => {
    const el = riskReturnContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [riskReturnData, indexCurrency]);

  // Scroll to bottom when index gets created (indexRiskReturn becomes available)
  useEffect(() => {
    if (indexRiskReturn) {
      const el = riskReturnContainerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, left: 0, behavior: 'auto' });
        });
      }
    }
  }, [indexRiskReturn]);

  return (
    <div style={{ 
      marginTop: '1rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: '0' }}>
          Risk-Return Chart
        </h3>

      </div>
      <div style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Zoom</span>
          <RiskReturnZoomSlider value={riskReturnZoom} onChange={(n) => setRiskReturnZoom(n)} />
          <button
            onClick={() => {
              setRiskReturnZoom(0.8);
              const el = riskReturnContainerRef.current;
              if (el) {
                requestAnimationFrame(() => {
                  el.scrollTo({ top: el.scrollHeight, left: 0, behavior: 'auto' });
                });
              }
            }}
            style={{ padding: '0.375rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#374151' }}
          >
            Reset
          </button>
        </div>
        <div ref={riskReturnContainerRef} style={{ overflow: 'auto', width: '100%', height: '40vh', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
          {indexRiskReturn ? (
            <RiskReturn
              data={riskReturnData as any}
              currency={indexCurrency}
              width={800}
              height={1200}
              zoom={riskReturnZoom}
              indexPoint={{ x: indexRiskReturn.risk, y: indexRiskReturn.return, name: 'Your Index', symbol: 'INDEX' }}
            />
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                  <path d="M3 3v18h18"/>
                  <path d="m9 9 3 3 3-3"/>
                  <path d="M9 12h6"/>
                  <path d="M9 16h6"/>
                </svg>
                <p style={{ fontSize: '0.875rem', margin: '0' }}>Make Index to display data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskReturnSection;
