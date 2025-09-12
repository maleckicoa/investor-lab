import React from 'react';

interface SectorSelectorProps {
  sectors: string[];
  selectedSectors: string[];
  setSelectedSectors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIndustries: string[];
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;
  industries: Record<string, string[]>;
  showSectorDropdown: boolean;
  setShowSectorDropdown: (show: boolean) => void;
  sectorDropdownPosition: { top: number; left: number };
  setSectorDropdownPosition: (position: { top: number; left: number }) => void;
  getDropdownPosition: (buttonElement: HTMLElement) => { top: number; left: number };
  handleSectorToggle: (sector: string) => void;
  handleSectorRemove: (sector: string) => void;
  isSectorFullySelected: (sector: string) => boolean;
  isSectorPartiallySelected: (sector: string) => boolean;
}

const SectorSelector: React.FC<SectorSelectorProps> = ({
  sectors,
  selectedSectors,
  setSelectedSectors,
  selectedIndustries,
  setSelectedIndustries,
  industries,
  showSectorDropdown,
  setShowSectorDropdown,
  sectorDropdownPosition,
  setSectorDropdownPosition,
  getDropdownPosition,
  handleSectorToggle,
  handleSectorRemove,
  isSectorFullySelected,
  isSectorPartiallySelected
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
      </h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            const newState = !showSectorDropdown;
            if (newState) {
              const position = getDropdownPosition(e.currentTarget);
              setSectorDropdownPosition(position);
            }
            setShowSectorDropdown(newState);
          }}
          style={{
            backgroundColor: '#2563eb',
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
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          SECTORS ({selectedSectors.length} selected)
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showSectorDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        {/* Sector Dropdown */}
        {showSectorDropdown && (
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
            {sectors.map((sector: string) => {
              const isSelected = selectedSectors.includes(sector);
              const isFullySelected = isSectorFullySelected(sector);
              const isPartiallySelected = isSectorPartiallySelected(sector);
              
              return (
                <button
                  key={sector}
                  onClick={() => handleSectorToggle(sector)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
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
                    {isPartiallySelected && !isFullySelected && (
                      <div style={{ 
                        width: '0.375rem',
                        height: '0.125rem',
                        backgroundColor: '#2563eb',
                        borderRadius: '0.0625rem'
                      }} />
                    )}
                  </div>
                  <span style={{ 
                    color: isSelected ? '#1d4ed8' : '#111827',
                    fontWeight: isSelected ? '600' : '400'
                  }}>
                    {sector}
                  </span>
                  {isPartiallySelected && !isFullySelected && (
                    <span style={{ 
                      fontSize: '0.625rem', 
                      color: '#6b7280',
                      marginLeft: 'auto'
                    }}>
                      Partial
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Selected Sectors Display */}
      {selectedSectors.length > 0 && (
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
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
              <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '0.75rem' }}>
                Selected Sectors ({selectedSectors.length})
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedSectors([]);
                setSelectedIndustries([]);
              }}
              style={{
                background: 'none',
                border: '1px solid #0ea5e9',
                color: '#0ea5e9',
                cursor: 'pointer',
                fontSize: '0.625rem',
                fontWeight: '500',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
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
              title="Remove all sectors and industries"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {selectedSectors.map((sector) => (
              <span
                key={sector}
                style={{
                  backgroundColor: '#0ea5e9',
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
                {sector}
                <button
                  onClick={() => {
                    handleSectorRemove(sector);
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
                  title="Remove this sector"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorSelector;
