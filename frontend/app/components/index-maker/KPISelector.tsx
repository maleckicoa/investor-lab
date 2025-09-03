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
}

const KPISelector: React.FC<KPISelectorProps> = ({
  kpis,
  selectedKPIs,
  setSelectedKPIs,
  showKPIDropdown,
  setShowKPIDropdown,
  kpiDropdownPosition,
  setKpiDropdownPosition,
  getDropdownPosition
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
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
            backgroundColor: '#4f46e5',
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
            e.currentTarget.style.backgroundColor = '#4338ca';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
        >
          KPIs ({Object.keys(selectedKPIs).length} selected)
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
            className="dropdown-container"
            style={{
              position: 'fixed',
              top: kpiDropdownPosition.top,
              left: kpiDropdownPosition.left,
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
            {Object.entries(kpis).map(([kpiName, kpiValues]) => {
              const isSelected = !!selectedKPIs[kpiName];
              const selectedValues = selectedKPIs[kpiName] || [];
              
              return (
                <div key={kpiName} style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {kpiName}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {isSelected && (
                        <span style={{ 
                          fontSize: '9px', 
                          color: '#6b7280',
                          backgroundColor: '#e5e7eb',
                          padding: '1px 4px',
                          borderRadius: '8px'
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
                          padding: '2px 6px',
                          backgroundColor: isSelected ? '#fee2e2' : '#dbeafe',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          color: isSelected ? '#dc2626' : '#1e40af',
                          fontSize: '9px',
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
                    gap: '4px'
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
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: isValueSelected ? '#dbeafe' : 'white',
                            color: isValueSelected ? '#1e40af' : '#374151',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
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
                            width: '10px', 
                            height: '10px', 
                            border: '2px solid #d1d5db',
                            borderRadius: '2px',
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
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '8px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
            </svg>
            <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '12px' }}>
              Selected KPIs ({Object.keys(selectedKPIs).length})
            </span>
          </div>
          
          {/* KPI Values Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(selectedKPIs).map(([kpiName, selectedValues]) => (
              <div key={kpiName} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '6px',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ 
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {kpiName}
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
                      padding: '2px 6px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: '3px',
                      color: '#dc2626',
                      fontSize: '9px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {selectedValues.map((value) => (
                    <span
                      key={value}
                      style={{
                        backgroundColor: '#e0e7ff',
                        color: '#374151',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
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
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0',
                          marginLeft: '2px',
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPISelector;
