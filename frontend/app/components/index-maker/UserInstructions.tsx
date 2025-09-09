'use client';

import { useState } from 'react';

export default function UserInstructions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: '#fde68a',
          border: '1px solid #f59e0b',
          color: '#92400e',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f59e0b';
          e.currentTarget.style.color = '#111827';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fde68a';
          e.currentTarget.style.color = '#92400e';
        }}
        title="How to use Index Maker"
      >
        How to use me?
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '640px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0' }}>
              How to use Index Maker
            </h2>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#374151' }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Create a custom index by choosing size, dates, currency, regions, sectors, industries, KPIs, and optional specific stocks. Then generate and analyze performance versus benchmarks.
              </p>
              <ol style={{ paddingLeft: '18px', margin: '0 0 12px 0' }}>
                <li>Configure index size, currency, start amount, and date range.</li>
                <li>Select countries, sectors and industries; add KPI filters as needed.</li>
                <li>Optionally add specific stocks.</li>
                <li>Pick benchmarks to compare against.</li>
                <li>Click MAKE INDEX to generate the index and view results.</li>
              </ol>
              <p style={{ margin: 0, color: '#6b7280', fontStyle: 'italic' }}>
                Tip: You can adjust parameters and regenerate to iterate quickly.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


