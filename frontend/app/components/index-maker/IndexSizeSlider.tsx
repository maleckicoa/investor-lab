'use client';

type Props = {
  value: number;
  onChange: (n: number) => void;
};

export default function IndexSizeSlider({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        Index Size
      </h3>
      <div style={{
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Top row: Label and Slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            minWidth: '60px'
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
              flex: '1',
              height: '6px',
              borderRadius: '3px',
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
          justifyContent: 'center',
          gap: '8px'
        }}>
          {[10, 50, 100, 500, 1000].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
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


