interface IndexResultsProps {
  indexResult: any;
  indexRiskReturn: { risk: number; return: number } | null;
  onClear: () => void;
}

export default function IndexResults({ indexResult, indexRiskReturn, onClear }: IndexResultsProps) {
  return (
    <div style={{ 
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0' }}>
          Index Results
        </h3>
        {indexResult && (
          <button
            onClick={onClear}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#dc2626',
              fontSize: '12px',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        fontSize: '14px'
      }}>
        <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' }}>
          <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#0c4a6e' }}>Annual Return:</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>
                {indexRiskReturn ? `${(indexRiskReturn.return * 100).toFixed(2)}%` : '--'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#0c4a6e' }}>Annual Risk:</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>
                {indexRiskReturn ? `${(indexRiskReturn.risk * 100).toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #22c55e' }}>
          <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>--</span>
          </div>
        </div>
      </div>
    </div>
  );
}


