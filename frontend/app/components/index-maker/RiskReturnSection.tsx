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
      marginTop: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0' }}>
          Risk-Return Chart
        </h3>

      </div>
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#6b7280', fontSize: '12px' }}>Zoom</span>
          <RiskReturnZoomSlider value={riskReturnZoom} onChange={(n) => setRiskReturnZoom(n)} />
          <button
            onClick={() => {
              setRiskReturnZoom(1);
              const el = riskReturnContainerRef.current;
              if (el) {
                requestAnimationFrame(() => {
                  el.scrollTo({ top: el.scrollHeight, left: 0, behavior: 'auto' });
                });
              }
            }}
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#374151' }}
          >
            Reset
          </button>
        </div>
        <div ref={riskReturnContainerRef} style={{ overflow: 'auto', width: '100%', height: '40vh', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
          {indexRiskReturn ? (
            <RiskReturn
              data={riskReturnData as any}
              currency={indexCurrency}
              width={800}
              height={5000}
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
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                  <path d="M3 3v18h18"/>
                  <path d="m9 9 3 3 3-3"/>
                  <path d="M9 12h6"/>
                  <path d="M9 16h6"/>
                </svg>
                <p style={{ fontSize: '14px', margin: '0' }}>Make Index to display data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskReturnSection;
