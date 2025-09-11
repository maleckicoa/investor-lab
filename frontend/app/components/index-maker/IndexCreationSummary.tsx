import React from 'react';

interface IndexCreationSummaryProps {
  indexSize: number;
  indexCurrency: 'USD' | 'EUR';
  indexStartAmount: number;
  indexStartDate: string;
  indexEndDate: string;
  countriesCount: number;
  kpiCategoriesCount: number;
  stocksCount: number;
}

const IndexCreationSummary: React.FC<IndexCreationSummaryProps> = ({
  indexSize,
  indexCurrency,
  indexStartAmount,
  indexStartDate,
  indexEndDate,
  countriesCount,
  kpiCategoriesCount,
  stocksCount,
}) => {
  return (
    <div style={{ 
      marginTop: '1rem',
      padding: '0.75rem',
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{ 
        fontSize: '0.875rem', 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: '0.5rem' 
      }}>
        Index Configuration Summary
      </h4>
      <div className="summary-grid" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
        <div className="summary-item"><strong>Size:</strong> {indexSize} stocks</div>
        <div className="summary-item summary-currency"><strong>Currency:</strong> {indexCurrency}</div>
        <div className="summary-item"><strong>Start Amount:</strong> {indexStartAmount}</div>
        <div className="summary-item summary-period"><strong>Period:</strong> {indexStartDate} to {indexEndDate}</div>
        <div className="summary-item"><strong>Countries:</strong> {countriesCount}</div>
        <div className="summary-item summary-kpis"><strong>KPIs:</strong> {kpiCategoriesCount}</div>
        <div className="summary-item"><strong>Stocks:</strong> {stocksCount}</div>
      </div>
    </div>
  );
};

export default IndexCreationSummary;
