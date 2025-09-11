import React from 'react';

interface DateRangePickerProps {
  indexStartDate: string;
  setIndexStartDate: (date: string) => void;
  indexEndDate: string;
  setIndexEndDate: (date: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  indexStartDate,
  setIndexStartDate,
  indexEndDate,
  setIndexEndDate
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
        Index Date Range
      </h3>
      <div className="dateRow" style={{ 
        display: 'flex', 
        gap: '0.75rem',
        flexWrap: 'wrap',
        width: '100%'
      }}>
        {/* Start Date */}
        <div className="dateField" style={{ flex: '1 1 0', minWidth: 0 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '500', 
            color: '#6b7280', 
            marginBottom: '0.25rem' 
          }}>
            Start Date
          </label>
          <input
            type="date"
            value={indexStartDate}
            onChange={(e) => {
              const newStart = e.target.value;
              setIndexStartDate(newStart);
              if (indexEndDate < newStart) {
                setIndexEndDate(newStart);
              }
            }}
            min={"2014-01-01"}
            max={indexEndDate}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              border: '0.0625rem solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#111827',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* End Date */}
        <div className="dateField" style={{ flex: '1 1 0', minWidth: 0 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '500', 
            color: '#6b7280', 
            marginBottom: '0.25rem' 
          }}>
            End Date
          </label>
          <input
            type="date"
            value={indexEndDate}
            onChange={(e) => {
              const newEnd = e.target.value;
              if (newEnd < indexStartDate) {
                setIndexEndDate(indexStartDate);
              } else {
                setIndexEndDate(newEnd);
              }
            }}
            min={indexStartDate}
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              fontSize: '0.8125rem',
              padding: '0.5rem 0.75rem',
              border: '0.0625rem solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#111827',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 48em) {
          .dateRow { flex-wrap: wrap; }
          .dateField { flex: 1 1 100%; min-width: 100%; }
        }
      `}</style>
      
      {/* Quick Date Presets */}
      <div style={{ 
        marginTop: '0.75rem',
        display: 'flex', 
        gap: '0.375rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            setIndexStartDate(startDate.toISOString().split('T')[0]);
            setIndexEndDate(endDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            backgroundColor: '#f3f4f6',
            border: '0.0625rem solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151'
          }}
          title="Last 1 year"
        >
          1Y
        </button>
        <button
          onClick={() => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 3);
            setIndexStartDate(startDate.toISOString().split('T')[0]);
            setIndexEndDate(endDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            backgroundColor: '#f3f4f6',
            border: '0.0625rem solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151'
          }}
          title="Last 3 years"
        >
          3Y
        </button>
        <button
          onClick={() => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 5);
            setIndexStartDate(startDate.toISOString().split('T')[0]);
            setIndexEndDate(endDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            backgroundColor: '#f3f4f6',
            border: '0.0625rem solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151'
          }}
          title="Last 5 years"
        >
          5Y
        </button>
        <button
          onClick={() => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 10);
            setIndexStartDate(startDate.toISOString().split('T')[0]);
            setIndexEndDate(endDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            backgroundColor: '#f3f4f6',
            border: '0.0625rem solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151'
          }}
          title="Last 10 years"
        >
          10Y
        </button>
        <button
          onClick={() => {
            const endDate = new Date();
            const earliest = '2014-01-01';
            setIndexStartDate(earliest);
            setIndexEndDate(endDate.toISOString().split('T')[0]);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            backgroundColor: '#f3f4f6',
            border: '0.0625rem solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: '#374151'
          }}
          title="Full available period"
        >
          All
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
