import React from 'react';

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
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
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
            backgroundColor: '#2563eb',
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
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
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
            className="dropdown-container"
            style={{
              position: 'fixed',
              top: benchmarkDropdownPosition.top,
              left: benchmarkDropdownPosition.left,
              width: '600px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {benchmarks.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                Loading benchmarks... ({benchmarks.length} loaded)
              </div>
            ) : (
              benchmarks.map((benchmark) => {
                const isSelected = selectedBenchmarks.includes(benchmark.symbol);
                return (
                <button
                  key={benchmark.symbol}
                  onClick={() => handleBenchmarkToggle(benchmark.symbol)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#111827',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
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
                    width: '14px', 
                    height: '14px', 
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
                  <span style={{ 
                    color: isSelected ? '#1e40af' : '#111827',
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
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
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
              <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '12px' }}>
                Selected Benchmarks ({selectedBenchmarks.length})
              </span>
            </div>
            <button
              onClick={() => setSelectedBenchmarks([])}
              style={{
                background: 'none',
                border: '1px solid #0ea5e9',
                color: '#0ea5e9',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0ea5e9';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#0ea5e9';
              }}
              title="Remove all benchmarks"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedBenchmarks.map((benchmarkSymbol) => {
              const benchmark = benchmarks.find(b => b.symbol === benchmarkSymbol);
              return (
                <span
                  key={benchmarkSymbol}
                  style={{
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
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
                      fontSize: '12px',
                      padding: '0',
                      marginLeft: '2px',
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
