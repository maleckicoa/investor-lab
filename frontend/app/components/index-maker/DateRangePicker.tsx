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
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        Index Date Range
      </h3>
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Start Date */}
        <div style={{ flex: '1' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#6b7280', 
            marginBottom: '4px' 
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
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#111827',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* End Date */}
        <div style={{ flex: '1' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#6b7280', 
            marginBottom: '4px' 
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
              fontSize: '13px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#111827',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
      
      {/* Quick Date Presets */}
      <div style={{ 
        marginTop: '12px',
        display: 'flex', 
        gap: '6px',
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
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
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
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
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
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
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
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
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
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
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
