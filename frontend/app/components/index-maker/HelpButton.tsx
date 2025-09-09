'use client';

import { useState } from 'react';

export default function HelpButton() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHelpModal(true)}
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
      >
        How to use me?
      </button>

      {/* Help Modal */}
      {showHelpModal && (
        <div onClick={() => setShowHelpModal(false)} style={{
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
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowHelpModal(false)}
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
            >
              ×
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              How to use Index Maker
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>
              <p style={{ marginBottom: '16px' }}>
                Welcome to the Index Maker! This tool helps you create custom stock indices by selecting specific criteria.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Step 1: Configure Your Index
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Start by setting the index size (number of stocks), currency (USD or EUR), start amount, and date range for your index.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Step 2: Select Criteria
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Choose countries, sectors, industries, and KPIs to filter stocks. You can also search for specific stocks to include.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Step 3: Create Your Index
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Click "MAKE INDEX" to generate your custom index. The system will calculate weights and performance metrics.
              </p>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Step 4: Analyze Results
              </h3>
              <p style={{ marginBottom: '16px' }}>
                View your index performance in the line chart, compare with benchmarks, and analyze risk-return characteristics.
              </p>
              <p style={{ marginBottom: '0', fontStyle: 'italic', color: '#6b7280' }}>
                This is placeholder text. Replace with actual help content as needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

