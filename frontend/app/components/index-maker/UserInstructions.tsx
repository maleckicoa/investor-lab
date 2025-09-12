'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function UserInstructions() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: '#fde68a',
          border: '1px solid #f59e0b',
          color: '#92400e',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '500',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
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

      {open && mounted && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '40rem',
              width: 'min(90vw, 40rem)',
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
                top: '0.75rem',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.75rem 0' }}>
              How to use Index Maker
            </h2>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#374151' }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                Create a custom index by choosing size, dates, currency, regions, sectors, industries, KPIs, and optional specific stocks. Then generate and analyze performance versus benchmarks.
              </p>
              <ol style={{ paddingLeft: '1.125rem', margin: '0 0 0.75rem 0' }}>
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
        </div>,
        document.body
      )}
    </>
  );
}


