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
      marginTop: '16px',
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: '8px' 
      }}>
        Index Configuration Summary
      </h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div><strong>Size:</strong> {indexSize} stocks</div>
        <div><strong>Currency:</strong> {indexCurrency}</div>
        <div><strong>Start Amount:</strong> {indexStartAmount}</div>
        <div><strong>Period:</strong> {indexStartDate} to {indexEndDate}</div>
        <div><strong>Countries:</strong> {countriesCount}</div>
        <div><strong>KPIs:</strong> {kpiCategoriesCount}</div>
        <div><strong>Stocks:</strong> {stocksCount}</div>
      </div>
    </div>
  );
};

export default IndexCreationSummary;
