import React, { useState } from 'react';

interface Benchmark {
  name: string;
  symbol: string;
  type: string;
  date: string;
}

interface BenchmarkSelectorProps {
  benchmarks: Benchmark[];
  selectedBenchmarks: string[];
  setSelectedBenchmarks: React.Dispatch<React.SetStateAction<string[]>>;
  showBenchmarkDropdown: boolean;
  setShowBenchmarkDropdown: (show: boolean) => void;
  benchmarkDropdownPosition: { top: number; left: number };
  setBenchmarkDropdownPosition: (position: { top: number; left: number }) => void;
  getDropdownPosition: (buttonElement: HTMLElement) => { top: number; left: number };
  handleBenchmarkToggle: (benchmark: string) => void;
}

const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({
  benchmarks,
  selectedBenchmarks,
  setSelectedBenchmarks,
  showBenchmarkDropdown,
  setShowBenchmarkDropdown,
  benchmarkDropdownPosition,
  setBenchmarkDropdownPosition,
  getDropdownPosition,
  handleBenchmarkToggle
}) => {
  const [benchmarkSearch, setBenchmarkSearch] = useState('');
  const normalizedQuery = benchmarkSearch.trim().toLowerCase();
  const filteredBenchmarks = normalizedQuery
    ? benchmarks.filter(b =>
        b.name.toLowerCase().includes(normalizedQuery) ||
        b.symbol.toLowerCase().includes(normalizedQuery)
      )
    : benchmarks;
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
      </h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            const newState = !showBenchmarkDropdown;
            if (newState) {
              const position = getDropdownPosition(e.currentTarget);
              setBenchmarkDropdownPosition(position);
            }
            setShowBenchmarkDropdown(newState);
          }}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          BENCHMARKS ({selectedBenchmarks.length} selected)
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showBenchmarkDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        {/* Benchmark Dropdown */}
        {showBenchmarkDropdown && (
          <div 
            className="dropdown-container dropdown-mobile"
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: 0,
              width: 'min(100%, 37.5rem)',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '18.75rem', /* 300px */
              overflowY: 'auto'
            }}
          >
            {/* Search input */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <input
                type="text"
                value={benchmarkSearch}
                onChange={(e) => setBenchmarkSearch(e.target.value)}
                placeholder="Search benchmark or symbol..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                  outline: 'none'
                }}
              />
            </div>
            {filteredBenchmarks.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                No benchmarks match "{benchmarkSearch}"
              </div>
            ) : (
              filteredBenchmarks.map((benchmark) => {
                const isSelected = selectedBenchmarks.includes(benchmark.symbol);
                return (
                <button
                  key={benchmark.symbol}
                  onClick={() => handleBenchmarkToggle(benchmark.symbol)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    backgroundColor: isSelected ? '#f9fafb' : 'transparent',
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    color: '#111827',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
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
                  <div style={{ 
                    width: '0.875rem', 
                    height: '0.875rem', 
                    border: '2px solid #d1d5db',
                    borderRadius: '0.1875rem',
                    backgroundColor: isSelected ? '#6b7280' : 'transparent',
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
                  <span style={{ 
                    color: isSelected ? '#374151' : '#111827',
                    fontWeight: isSelected ? '600' : '400'
                  }}>
                    {benchmark.name} - {benchmark.symbol}
                  </span>
                </button>
              );
            })
            )}
          </div>
        )}
      </div>
      
      {/* Selected Benchmarks Display */}
      {selectedBenchmarks.length > 0 && (
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#f9fafb',
          border: '1px solid #6b7280',
          borderRadius: '0.375rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '0.375rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
              <span style={{ color: '#374151', fontWeight: '500', fontSize: '0.75rem' }}>
                Selected Benchmarks ({selectedBenchmarks.length})
              </span>
            </div>
            <button
              onClick={() => setSelectedBenchmarks([])}
              style={{
                background: 'none',
                border: '1px solid #6b7280',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.625rem',
                fontWeight: '500',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Remove all benchmarks"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {selectedBenchmarks.map((benchmarkSymbol) => {
              const benchmark = benchmarks.find(b => b.symbol === benchmarkSymbol);
              return (
                <span
                  key={benchmarkSymbol}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {benchmark ? `${benchmark.name} - ${benchmark.symbol}` : benchmarkSymbol}
                  <button
                    onClick={() => {
                      setSelectedBenchmarks(prev => prev.filter(b => b !== benchmarkSymbol));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '0',
                      marginLeft: '0.125rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove this benchmark"
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

export default BenchmarkSelector;
