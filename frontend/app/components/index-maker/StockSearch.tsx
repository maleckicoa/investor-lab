import React from 'react';

interface Company {
  symbol: string;
  company_name: string;
}

interface StockSearchProps {
  companies: Company[];
  selectedStocks: string[];
  setSelectedStocks: React.Dispatch<React.SetStateAction<string[]>>;
  showStockSearch: boolean;
  setShowStockSearch: (show: boolean) => void;
  stockSearchPosition: { top: number; left: number };
  setStockSearchPosition: (position: { top: number; left: number }) => void;
  stockSearchQuery: string;
  setStockSearchQuery: (query: string) => void;
  stockSearchResults: Company[];
  setStockSearchResults: (results: Company[]) => void;
  getDropdownPosition: (buttonElement: HTMLElement) => { top: number; left: number };
}

const StockSearch: React.FC<StockSearchProps> = ({
  companies,
  selectedStocks,
  setSelectedStocks,
  showStockSearch,
  setShowStockSearch,
  stockSearchPosition,
  setStockSearchPosition,
  stockSearchQuery,
  setStockSearchQuery,
  stockSearchResults,
  setStockSearchResults,
  getDropdownPosition
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
      </h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            const newState = !showStockSearch;
            if (newState) {
              const position = getDropdownPosition(e.currentTarget);
              setStockSearchPosition(position);
            }
            setShowStockSearch(newState);
          }}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          STOCKS ({selectedStocks.length} selected)
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showStockSearch ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        {/* Stock Search Dropdown */}
        {showStockSearch && (
          <div 
            className="dropdown-container"
            style={{
              position: 'fixed',
              top: stockSearchPosition.top,
              left: stockSearchPosition.left,
              width: '600px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {/* Search Input */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <input
                type="text"
                placeholder="Search by company name or symbol..."
                value={stockSearchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setStockSearchQuery(query);
                  
                  if (query.length >= 2) {
                    // Filter companies based on query
                    const filtered = companies.filter(company => 
                      company.company_name.toLowerCase().includes(query.toLowerCase()) ||
                      company.symbol.toLowerCase().includes(query.toLowerCase())
                    );
                    setStockSearchResults(filtered.slice(0, 50)); // Limit to 50 results
                  } else {
                    setStockSearchResults([]);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={() => setStockSearchResults([])}
              />
            </div>
            
            {/* Search Results */}
            {stockSearchResults.length > 0 && (
              <div>
                {stockSearchResults.map((company) => {
                  const isSelected = selectedStocks.includes(company.symbol);
                  return (
                    <button
                      key={company.symbol}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStocks(prev => prev.filter(s => s !== company.symbol));
                        } else {
                          setSelectedStocks(prev => [...prev, company.symbol]);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#111827',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid #d1d5db',
                          borderRadius: '3px',
                          backgroundColor: isSelected ? '#2563eb' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M9 12l2 2 4-4"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {company.company_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {company.symbol}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* No Results */}
            {stockSearchQuery.length >= 2 && stockSearchResults.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                No companies found matching "{stockSearchQuery}"
              </div>
            )}
            
            {/* Instructions */}
            {stockSearchQuery.length < 2 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                Type at least 2 letters...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Selected Stocks Display */}
      {selectedStocks.length > 0 && (
        <div style={{ 
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
              <span style={{ color: '#991b1b', fontWeight: '500', fontSize: '12px' }}>
                Selected Stocks ({selectedStocks.length})
              </span>
            </div>
            <button
              onClick={() => setSelectedStocks([])}
              style={{
                background: 'none',
                border: '1px solid #fecaca',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fecaca';
                e.currentTarget.style.color = '#991b1b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#991b1b';
              }}
              title="Remove all stocks"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedStocks.map((symbol) => {
              const company = companies.find(c => c.symbol === symbol);
              return (
                <span
                  key={symbol}
                  style={{
                    backgroundColor: '#fecaca',
                    color: '#991b1b',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {company?.company_name || symbol}
                  <button
                    onClick={() => {
                      setSelectedStocks(prev => prev.filter(s => s !== symbol));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#991b1b',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '0',
                      marginLeft: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove this stock"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch;
