interface IndexResultsProps {
  indexResult: any;
  indexRiskReturn: { risk: number; return: number } | null;
  onClear: () => void;
}

export default function IndexResults({ indexResult, indexRiskReturn, onClear }: IndexResultsProps) {
  return (
    <div style={{ 
      marginBottom: '1.5rem',
      padding: '1.25rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0' }}>
          Index Results
        </h3>
        {indexResult && (
          <button
            onClick={onClear}
            style={{
              marginLeft: 'auto',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.25rem',
              color: '#dc2626',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
          >
            Clear Results
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(12.5rem, 1fr))', 
        gap: '1rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #0ea5e9' }}>
          <div style={{ minHeight: '2.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', rowGap: '0.25rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#0c4a6e' }}>Annual Return:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                {indexRiskReturn ? `${(indexRiskReturn.return * 100).toFixed(2)}%` : '--'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#0c4a6e' }}>Annual Risk:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                {indexRiskReturn ? `${(indexRiskReturn.risk * 100).toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #22c55e' }}>
          <div style={{ minHeight: '2.75rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>--</span>
          </div>
        </div>
      </div>
    </div>
  );
}


