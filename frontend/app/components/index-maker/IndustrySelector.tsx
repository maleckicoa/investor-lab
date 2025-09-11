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
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
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
            className="dropdown-container dropdown-mobile"
            style={{
              position: 'fixed',
              top: industryDropdownPosition.top,
              left: industryDropdownPosition.left,
              width: 'min(37.5rem, 90vw)',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '18.75rem', /* 300px */
              overflowY: 'auto'
            }}
          >
            {Object.entries(industries).map(([sector, industriesList]) => (
              <div key={sector}>
                <div style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#f9fafb',
                  fontSize: '0.6875rem',
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
                        padding: '0.375rem 0.75rem 0.375rem 1.5rem',
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
                        width: '0.75rem', 
                        height: '0.75rem', 
                        border: '2px solid #d1d5db',
                        borderRadius: '0.125rem',
                        backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
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
                        color: isSelected ? '#1d4ed8' : '#111827',
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
              title="Remove all industries and sectors"
            >
              Remove all
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxHeight: '15vh', overflowY: 'auto' }}>
            {selectedIndustries.map((industry) => (
              <span
                key={industry}
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
                    fontSize: '0.75rem',
                    padding: '0',
                    marginLeft: '0.125rem',
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
