'use client';

type Props = {
  value: number;
  onChange: (n: number) => void;
};

export default function IndexSizeSlider({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
        Index Size
      </h3>
      <div style={{
        padding: 'clamp(0.75rem, 2vw, 1.5rem)',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        {/* Top row: Label and Slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          width: '100%',
          minWidth: 0
        }}>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            whiteSpace: 'nowrap',
            flex: '0 0 auto'
          }}>
            Stocks: {value}
          </span>
          <input
            type="range"
            min="1"
            max="1000"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              height: '0.375rem',
              borderRadius: '0.1875rem',
              background: '#dbeafe',
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLInputElement).style.background = '#2563eb';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLInputElement).style.background = '#dbeafe';
            }}
          />
        </div>

        {/* Bottom row: Preset buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {[10, 50, 100, 500, 1000].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: '#374151'
              }}
              title={`Set to ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


