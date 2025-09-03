import React from 'react';

interface CurrencyAndStartAmountProps {
  indexCurrency: "USD" | "EUR";
  setIndexCurrency: (currency: "USD" | "EUR") => void;
  indexStartAmount: number;
  setIndexStartAmount: (amount: number) => void;
}

const CurrencyAndStartAmount: React.FC<CurrencyAndStartAmountProps> = ({
  indexCurrency,
  setIndexCurrency,
  indexStartAmount,
  setIndexStartAmount
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ 
        display: 'flex', 
        gap: '32px',
        alignItems: 'flex-start'
      }}>
        {/* Index Currency */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Index Currency
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '8px'
          }}>
            <button
              onClick={() => setIndexCurrency('USD' as "USD" | "EUR")}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: indexCurrency === 'USD' ? '#059669' : '#f3f4f6',
                color: indexCurrency === 'USD' ? 'white' : '#374151',
                border: indexCurrency === 'USD' ? '1px solid #059669' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                if (indexCurrency !== 'USD') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (indexCurrency !== 'USD') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              USD
            </button>
            <button
              onClick={() => setIndexCurrency('EUR' as "USD" | "EUR")}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: indexCurrency === 'EUR' ? '#059669' : '#f3f4f6',
                color: indexCurrency === 'EUR' ? 'white' : '#374151',
                border: indexCurrency === 'EUR' ? '1px solid #059669' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                if (indexCurrency !== 'EUR') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (indexCurrency !== 'EUR') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              EUR
            </button>
          </div>
        </div>

        {/* Start Amount */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Start Amount
          </h3>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(indexStartAmount)}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
              const normalized = digitsOnly.replace(/^0+(?=\d)/, '');
              const nextValue = normalized === '' ? 0 : Number(normalized);
              setIndexStartAmount(nextValue);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '120px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CurrencyAndStartAmount;
