import React from 'react';

interface KPISelectorProps {
  kpis: Record<string, string[]>;
  selectedKPIs: Record<string, string[]>;
  setSelectedKPIs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  showKPIDropdown: boolean;
  setShowKPIDropdown: (show: boolean) => void;
  kpiDropdownPosition: { top: number; left: number };
  setKpiDropdownPosition: (position: { top: number; left: number }) => void;
  getDropdownPosition: (buttonElement: HTMLElement) => { top: number; left: number };
  kpiLabels?: Record<string, string>; // mapping from kpi_name to kpi_name_clean for display
}

const KPISelector: React.FC<KPISelectorProps> = ({
  kpis,
  selectedKPIs,
  setSelectedKPIs,
  showKPIDropdown,
  setShowKPIDropdown,
  kpiDropdownPosition,
  setKpiDropdownPosition,
  getDropdownPosition,
  kpiLabels = {}
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
      </h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            const newState = !showKPIDropdown;
            if (newState) {
              const position = getDropdownPosition(e.currentTarget);
              setKpiDropdownPosition(position);
            }
            setShowKPIDropdown(newState);
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
          FUNDAMENTALS ({Object.keys(selectedKPIs).length} selected)
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showKPIDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              marginLeft: 'auto'
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        {/* KPI Dropdown */}
        {showKPIDropdown && (
          <div 
            className="dropdown-container dropdown-mobile"
            style={{
              position: 'fixed',
              top: kpiDropdownPosition.top,
              left: kpiDropdownPosition.left,
              width: '37.5rem', /* 600px */
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '18.75rem', /* 300px */
              overflowY: 'auto'
            }}
          >
            {Object.entries(kpis).map(([kpiName, kpiValues]) => {
              const isSelected = !!selectedKPIs[kpiName];
              const selectedValues = selectedKPIs[kpiName] || [];
              const displayName = kpiLabels[kpiName] || kpiName;
              
              return (
                <div key={kpiName} style={{
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.375rem'
                  }}>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {displayName}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      {isSelected && (
                        <span style={{ 
                          fontSize: '0.5625rem', 
                          color: '#6b7280',
                          backgroundColor: '#e5e7eb',
                          padding: '0.0625rem 0.25rem',
                          borderRadius: '0.5rem'
                        }}>
                          {selectedValues.length} selected
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            setSelectedKPIs(prev => {
                              const newKPIs = { ...prev };
                              delete newKPIs[kpiName];
                              return newKPIs;
                            });
                          } else {
                            setSelectedKPIs(prev => ({
                              ...prev,
                              [kpiName]: [...kpiValues]
                            }));
                          }
                        }}
                        style={{
                          padding: '0.125rem 0.375rem',
                          backgroundColor: isSelected ? '#fee2e2' : '#dbeafe',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.1875rem',
                          color: isSelected ? '#dc2626' : '#1e40af',
                          fontSize: '0.5625rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {isSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem'
                  }}>
                    {kpiValues.map((value) => {
                      const isValueSelected = selectedValues.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isValueSelected) {
                              setSelectedKPIs(prev => {
                                const newValues = prev[kpiName].filter(v => v !== value);
                                if (newValues.length === 0) {
                                  const newKPIs = { ...prev };
                                  delete newKPIs[kpiName];
                                  return newKPIs;
                                }
                                return {
                                  ...prev,
                                  [kpiName]: newValues
                                };
                              });
                            } else {
                              setSelectedKPIs(prev => ({
                                ...prev,
                                [kpiName]: [...(prev[kpiName] || []), value]
                              }));
                            }
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #d1d5db',
                            backgroundColor: isValueSelected ? '#dbeafe' : 'white',
                            color: isValueSelected ? '#1e40af' : '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: isValueSelected ? '500' : '400'
                          }}
                          onMouseEnter={(e) => {
                            if (!isValueSelected) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isValueSelected) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          <div style={{ 
                            width: '0.625rem', 
                            height: '0.625rem', 
                            border: '2px solid #d1d5db',
                            borderRadius: '0.125rem',
                            backgroundColor: isValueSelected ? '#2563eb' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isValueSelected && (
                              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M9 12l2 2 4-4"/>
                              </svg>
                            )}
                          </div>
                          <span>{value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Selected KPIs Display */}
      {Object.keys(selectedKPIs).length > 0 && (
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.375rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.375rem',
            marginBottom: '0.5rem'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
            </svg>
            <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '0.75rem' }}>
              Selected Fundamentals ({Object.keys(selectedKPIs).length})
            </span>
          </div>
          
          {/* KPI Values Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(selectedKPIs).map(([kpiName, selectedValues]) => {
              const displayName = kpiLabels[kpiName] || kpiName;
              return (
              <div key={kpiName} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.375rem',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '0.25rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {displayName}
                  </span>
                  
                  <button
                    onClick={() => {
                      setSelectedKPIs(prev => {
                        const newKPIs = { ...prev };
                        delete newKPIs[kpiName];
                        return newKPIs;
                      });
                    }}
                    style={{
                      padding: '0.125rem 0.375rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #0ea5e9',
                      borderRadius: '0.1875rem',
                      color: '#0ea5e9',
                      fontSize: '0.5625rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0ea5e9';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#0ea5e9';
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.1875rem' }}>
                  {selectedValues.map((value) => (
                    <span
                      key={value}
                      style={{
                        backgroundColor: '#0ea5e9',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.1875rem',
                        fontSize: '0.625rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.1875rem'
                      }}
                    >
                      {value}
                      <button
                        onClick={() => {
                          setSelectedKPIs(prev => {
                            const newValues = prev[kpiName].filter(v => v !== value);
                            if (newValues.length === 0) {
                              const newKPIs = { ...prev };
                              delete newKPIs[kpiName];
                              return newKPIs;
                            }
                            return {
                              ...prev,
                              [kpiName]: newValues
                            };
                          });
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
                        title="Remove this value"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPISelector;
