import React from 'react';

interface SelectionSummaryProps {
  selectedCountriesCount: number;
  selectedSectorsCount: number;
  selectedIndustriesCount: number;
  selectedKPIs: Record<string, string[]>;
  selectedStocksCount: number;
}

const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  selectedCountriesCount,
  selectedSectorsCount,
  selectedIndustriesCount,
  selectedKPIs,
  selectedStocksCount,
}) => {
  const selectedKpiCategories = Object.keys(selectedKPIs).length;
  const selectedKpiValuesTotal = Object.values(selectedKPIs).flat().length;

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '6px',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
        Selection Summary
      </h3>
      <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
        <strong>{selectedCountriesCount}</strong> countries, <strong>{selectedSectorsCount}</strong> sectors, <strong>{selectedIndustriesCount}</strong> industries, <strong>{selectedKpiCategories}</strong> KPIs, and <strong>{selectedStocksCount}</strong> stocks selected
      </p>
      {selectedKpiCategories > 0 && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
          <strong>Selected KPI values:</strong> {selectedKpiValuesTotal} total values
        </div>
      )}
    </div>
  );
};

export default SelectionSummary;
