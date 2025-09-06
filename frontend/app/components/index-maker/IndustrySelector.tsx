import React from 'react';

interface IndustrySelectorProps {
  industries: Record<string, string[]>;
  selectedIndustries: string[];
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSectors: string[];
  setSelectedSectors: React.Dispatch<React.SetStateAction<string[]>>;
  showIndustryDropdown: boolean;
  setShowIndustryDropdown: (show: boolean) => void;
  industryDropdownPosition: { top: number; left: number };
  setIndustryDropdownPosition: (position: { top: number; left: number }) => void;
  getDropdownPosition: (buttonElement: HTMLElement) => { top: number; left: number };
  handleIndustryToggle: (industry: string) => void;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  industries,
  selectedIndustries,
  setSelectedIndustries,
  selectedSectors,
  setSelectedSectors,
  showIndustryDropdown,
  setShowIndustryDropdown,
  industryDropdownPosition,
  setIndustryDropdownPosition,
  getDropdownPosition,
  handleIndustryToggle
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
      </h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            const newState = !showIndustryDropdown;
            if (newState) {
              const position = getDropdownPosition(e.currentTarget);
              setIndustryDropdownPosition(position);
            }
            setShowIndustryDropdown(newState);
          }}
          style={{
            backgroundColor: '#059669',
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
            e.currentTarget.style.backgroundColor = '#047857';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
        >
          INDUSTRIES ({selectedIndustries.length} selected)
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showIndustryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        {/* Industry Dropdown */}
        {showIndustryDropdown && (
          <div 
            className="dropdown-container"
            style={{
              position: 'fixed',
              top: industryDropdownPosition.top,
              left: industryDropdownPosition.left,
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
            {Object.entries(industries).map(([sector, industriesList]) => (
              <div key={sector}>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {sector}
                </div>
                {industriesList.map((industry: string) => {
                  const isSelected = selectedIndustries.includes(industry);
                  return (
                    <button
                      key={industry}
                      onClick={() => handleIndustryToggle(industry)}
                      style={{
                        width: '100%',
                        padding: '6px 12px 6px 24px',
                        border: 'none',
                        backgroundColor: isSelected ? '#d1fae5' : 'transparent',
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
                        width: '12px', 
                        height: '12px', 
                        border: '2px solid #d1d5db',
                        borderRadius: '2px',
                        backgroundColor: isSelected ? '#059669' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ 
                        color: isSelected ? '#065f46' : '#111827',
                        fontWeight: isSelected ? '500' : '400'
                      }}>
                        {industry}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Industries Display */}
      {selectedIndustries.length > 0 && (
        <div style={{ 
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
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
              <span style={{ color: '#166534', fontWeight: '500', fontSize: '12px' }}>
                Selected Industries ({selectedIndustries.length})
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedIndustries([]);
                setSelectedSectors([]);
              }}
              style={{
                background: 'none',
                border: '1px solid #22c55e',
                color: '#22c55e',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#22c55e';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#22c55e';
              }}
              title="Remove all industries and sectors"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedIndustries.map((industry) => (
              <span
                key={industry}
                style={{
                  backgroundColor: '#22c55e',
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
                {industry}
                <button
                  onClick={() => {
                    setSelectedIndustries(prev => prev.filter(i => i !== industry));
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
                  title="Remove this industry"
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

export default IndustrySelector;
