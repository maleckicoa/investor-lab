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
            {/* <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#374151' }}>
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
            </div> */}
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#374151' }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                <strong>Index Maker</strong> is a powerful tool that allows you to quickly prototype and test your investment strategies.
                By choosing your own dimensions, you can build a custom portfolio and compare its performance against well-known benchmarks.
              </p>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                The tool supports over 30,000 liquid stocks worldwide, provided they have consistent price, volume, and market cap history.
              </p>
              <br /><br />
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Left Panel</strong></p>
              <p style={{ margin: '0 0 0.5rem 0' }}>To build your index or portfolio, use the left panel to configure:</p>
              <ul style={{ paddingLeft: '1.125rem', margin: '0 0 0.75rem 0' }}>
                <li>Maximum number of stocks in your portfolio.</li>
                <li>Denomination currency (<em>USD</em> or <em>EUR</em>).</li>
                <li>Initial investment amount.</li>
                <li>Weighting method: market-cap weighted or equally weighted.</li>
                <li>Start and end date of the index.</li>
                <li>Countries, sectors, and industries from which stocks are selected.</li>
                <li>Fundamental filters: choose from 50+ financial metrics and select preferred percentile ranges (e.g., high P/E ratio, low Debt/Asset ratio).</li>
                <li>Specific stock overrides:
                    In addition to rule-based filtering, you can manually include particular stocks in your portfolio. 
                    This is useful if there are “must-have” companies you always want in your index, regardless of whether 
                    they meet your filters. For example, you might require Apple or Tesla to be included even if they fall 
                    outside your chosen fundamental or sector criteria.  
                    <br />  
                    Conversely, you can also create a portfolio entirely from a custom list of stocks by leaving all filters 
                    blank and selecting only the companies you care about (e.g., a simple Coca-Cola + Microsoft portfolio). 
                    This flexibility lets you combine systematic strategies with discretionary picks, or go fully manual if desired.
                  </li>
                
                <li>Benchmarks: Choose over 150 indices or ETFs to compare against your custom portfolio.</li>
              </ul>

              <p style={{ margin: '0 0 0.75rem 0' }}>
                Once configured, click <strong>MAKE INDEX</strong> to generate results.
              </p>

              <br /><br />
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Right Panel</strong></p>
              <p style={{ margin: '0 0 0.5rem 0' }}> Your custom index resuls will appear here. Available analytics include:</p>
              <ul style={{ paddingLeft: '1.125rem', margin: '0 0 0.75rem 0' }}>
                <li><strong>Annual Return</strong> — the average yearly return since 2014, based on rolling 250-day windows.</li>
                <li><strong>Annual Risk</strong> — the standard deviation of negative deviations from the average annual return.</li>
                <li><strong>Index vs Benchmark Chart</strong> — compares your index performance against chosen benchmarks over time.</li>
                <li><strong>Risk–Return Map</strong> — plots your index relative to benchmarks. Ideally, your portfolio should sit on the North-West frontier (highest return for lowest risk).</li>
                <li><strong>Constituent Weights</strong> — shows quarterly rebalancing from 2014 onward, including stock composition and weights per quarter.</li>
              </ul>

              <br /><br />
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Notes and Limitations</strong></p>
              <ul style={{ paddingLeft: '1.125rem', margin: 0 }}>
                <li>
                  <strong>Historical coverage:</strong> Stock data is currently available starting from January 1, 2014. 
                </li>
                <li>
                  <strong>Asset types:</strong> Only equities (stocks) are included at this stage. Other asset classes 
                  such as bonds, commodities, or crypto are not yet supported.
                </li>
                <li>
                  <strong>Rebalancing:</strong> Portfolios are assumed to rebalance on a quarterly basis (aligned to full calendar quarters). 
                  Monthly, annual, or custom rebalancing intervals are not yet configurable.
                </li>
                <li>
                  <strong>Stock selection:</strong> Within the chosen filters, stock inclusion prioritizes companies with the largest 
                  market capitalization on the date of rebalancing. Inclusion which prioritize e.g. revenue growth or some other metrics
                  is not yet supported.
                </li>
                <li>
                  <strong>Dividends:</strong> Dividend payments are not factored into index performance. Portfolios heavy 
                  in dividend-paying stocks may appear to underperform compared to their real-world counterparts.
                </li>
              </ul>

            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}


