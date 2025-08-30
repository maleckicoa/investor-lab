'use client';

import { useState, useEffect } from 'react';

// Types for the API response
interface IndexFields {
  countries: string[];
  sectors: string[];
  industries: Record<string, string[]>;
  kpis: Record<string, string[]>;
}

// Type for KPI selection with selected values
interface KPISelection {
  [kpi: string]: string[];
}

export default function IndexMakerPage() {
  const [countries, setCountries] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [industries, setIndustries] = useState<Record<string, string[]>>({});
  const [kpis, setKpis] = useState<Record<string, string[]>>({});
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<KPISelection>({});
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showKPIDropdown, setShowKPIDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch countries, sectors, industries and KPIs data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/index-fields');
        if (!response.ok) {
          throw new Error('Failed to fetch index fields data');
        }
        const data: IndexFields = await response.json();
        setCountries(data.countries);
        setSectors(data.sectors);
        setIndustries(data.industries);
        setKpis(data.kpis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get all industries for selected sectors
  const getIndustriesForSelectedSectors = () => {
    const industriesList: string[] = [];
    selectedSectors.forEach(sector => {
      if (industries[sector]) {
        industriesList.push(...industries[sector]);
      }
    });
    return industriesList;
  };

  // Handle sector selection/deselection
  const handleSectorToggle = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      // Remove sector and all its industries
      setSelectedSectors(prev => prev.filter(s => s !== sector));
      setSelectedIndustries(prev => prev.filter(industry => !industries[sector]?.includes(industry)));
    } else {
      // Add sector and all its industries
      setSelectedSectors(prev => [...prev, sector]);
      const sectorIndustries = industries[sector] || [];
      setSelectedIndustries(prev => Array.from(new Set([...prev, ...sectorIndustries])));
    }
  };

  // Handle individual industry selection/deselection
  const handleIndustryToggle = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(prev => prev.filter(i => i !== industry));
    } else {
      setSelectedIndustries(prev => [...prev, industry]);
    }
  };

  // Handle country selection/deselection
  const handleCountryToggle = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(prev => prev.filter(c => c !== country));
    } else {
      setSelectedCountries(prev => [...prev, country]);
    }
  };

  // Check if all industries of a sector are selected
  const isSectorFullySelected = (sector: string) => {
    const sectorIndustries = industries[sector] || [];
    return sectorIndustries.every((industry: string) => selectedIndustries.includes(industry));
  };

  // Check if sector is partially selected (some industries selected)
  const isSectorPartiallySelected = (sector: string) => {
    const sectorIndustries = industries[sector] || [];
    const hasSelected = sectorIndustries.some((industry: string) => selectedIndustries.includes(industry));
    const hasUnselected = sectorIndustries.some((industry: string) => !selectedIndustries.includes(industry));
    return hasSelected && hasUnselected;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading countries, sectors, industries and KPIs...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '6px', 
        padding: '1rem',
        margin: '24px'
      }}>
        <div style={{ display: 'flex' }}>
          <div style={{ marginLeft: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b' }}>Error</h3>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#b91c1c' }}>{error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '12px',
                backgroundColor: '#fee2e2',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                color: '#991b1b',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          Index Maker
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Create and manage custom stock indices by selecting sectors and industries
        </p>
        
        {/* Countries Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Countries
          </h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              COUNTRIES ({selectedCountries.length} selected)
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ 
                  transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
            {/* Country Dropdown */}
            {showCountryDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {countries.map((country: string) => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <button
                      key={country}
                      onClick={() => handleCountryToggle(country)}
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ 
                        color: isSelected ? '#1e40af' : '#111827',
                        fontWeight: isSelected ? '600' : '400'
                      }}>
                        {country}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Selected Countries Display */}
          {selectedCountries.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '6px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
                  Selected Countries ({selectedCountries.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedCountries.map((country) => (
                  <span
                    key={country}
                    style={{
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sectors Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Sectors
          </h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSectorDropdown(!showSectorDropdown)}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
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
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ 
                  transform: showSectorDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
            {/* Sector Dropdown */}
            {showSectorDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                        )}
                        {isPartiallySelected && !isFullySelected && (
                          <div style={{ 
                            width: '8px', 
                            height: '2px', 
                            backgroundColor: '#2563eb',
                            borderRadius: '1px'
                          }} />
                        )}
                      </div>
                      <span style={{ 
                        color: isSelected ? '#1e40af' : '#111827',
                        fontWeight: isSelected ? '600' : '400'
                      }}>
                        {sector}
                      </span>
                      {isPartiallySelected && !isFullySelected && (
                        <span style={{ 
                          fontSize: '12px', 
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
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '6px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
                  Selected Sectors ({selectedSectors.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedSectors.map((sector) => (
                  <span
                    key={sector}
                    style={{
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Industries Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Industries
          </h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
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
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ 
                  transform: showIndustryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
            {/* Industry Dropdown */}
            {showIndustryDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                maxHeight: '400px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {Object.entries(industries).map(([sector, industriesList]) => (
                  <div key={sector}>
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#f9fafb',
                      fontSize: '12px',
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
                            padding: '8px 16px 8px 32px',
                            border: 'none',
                            backgroundColor: isSelected ? '#d1fae5' : 'transparent',
                            textAlign: 'left',
                            fontSize: '14px',
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
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '6px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <span style={{ color: '#166534', fontWeight: '500' }}>
                  Selected Industries ({selectedIndustries.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedIndustries.map((industry) => (
                  <span
                    key={industry}
                    style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KPIs Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            KPIs
          </h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowKPIDropdown(!showKPIDropdown)}
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
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
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ 
                  transform: showKPIDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            
                                    {/* KPI Dropdown */}
            {showKPIDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                maxHeight: '400px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {Object.entries(kpis).map(([kpiName, kpiValues]) => {
                  const isSelected = !!selectedKPIs[kpiName];
                  const selectedValues = selectedKPIs[kpiName] || [];
                  
                  return (
                    <div key={kpiName} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {kpiName}
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {isSelected && (
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#6b7280',
                              backgroundColor: '#e5e7eb',
                              padding: '2px 6px',
                              borderRadius: '10px'
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
                              padding: '4px 8px',
                              backgroundColor: isSelected ? '#fee2e2' : '#dbeafe',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              color: isSelected ? '#dc2626' : '#1e40af',
                              fontSize: '10px',
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
                        gap: '8px'
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
                                      // Remove the KPI entirely if no values are selected
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
                                padding: '6px 12px',
                                border: '1px solid #d1d5db',
                                backgroundColor: isValueSelected ? '#dbeafe' : 'white',
                                color: isValueSelected ? '#1e40af' : '#374151',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
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
                                width: '12px', 
                                height: '12px', 
                                border: '2px solid #d1d5db',
                                borderRadius: '2px',
                                backgroundColor: isValueSelected ? '#2563eb' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {isValueSelected && (
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
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
               marginTop: '16px',
               padding: '16px',
               backgroundColor: '#f0f9ff',
               border: '1px solid #0ea5e9',
               borderRadius: '6px'
             }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '8px',
                 marginBottom: '16px'
               }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M9 12l2 2 4-4"/>
                   <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                 </svg>
                 <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
                   Selected KPIs ({Object.keys(selectedKPIs).length})
                 </span>
               </div>
               
               {/* KPI Values Display */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {Object.entries(selectedKPIs).map(([kpiName, selectedValues]) => (
                   <div key={kpiName} style={{ 
                     display: 'flex', 
                     flexDirection: 'column',
                     gap: '8px',
                     padding: '12px',
                     backgroundColor: 'white',
                     borderRadius: '6px',
                     border: '1px solid #e5e7eb'
                   }}>
                     <div style={{ 
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between'
                     }}>
                       <span style={{ 
                         fontSize: '14px',
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
                           padding: '4px 8px',
                           backgroundColor: '#fee2e2',
                           border: '1px solid #fecaca',
                           borderRadius: '4px',
                           color: '#dc2626',
                           fontSize: '12px',
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
                         Remove KPI
                       </button>
                     </div>
                     
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                       {selectedValues.map((value) => (
                         <span
                           key={value}
                           style={{
                             backgroundColor: '#e0e7ff',
                             color: '#374151',
                             padding: '4px 8px',
                             borderRadius: '4px',
                             fontSize: '12px',
                             fontWeight: '500',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                         >
                           {value}
                           <button
                             onClick={() => {
                               setSelectedKPIs(prev => {
                                 const newValues = prev[kpiName].filter(v => v !== value);
                                 if (newValues.length === 0) {
                                   // Remove the KPI entirely if no values are selected
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
                               fontSize: '14px',
                               padding: '0',
                               marginLeft: '4px',
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

        {/* Summary */}
        <div style={{ 
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Selection Summary
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
            <strong>{selectedCountries.length}</strong> countries, <strong>{selectedSectors.length}</strong> sectors, <strong>{selectedIndustries.length}</strong> industries, and <strong>{Object.keys(selectedKPIs).length}</strong> KPIs selected
          </p>
          {Object.keys(selectedKPIs).length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              <strong>Selected KPI values:</strong> {Object.values(selectedKPIs).flat().length} total values
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
