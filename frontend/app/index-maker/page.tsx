'use client';

import { useState, useEffect } from 'react';

// Types for the API response
interface IndexFields {
  countries: Array<{country_code: string, country_name: string}>;
  sectors: string[];
  industries: Record<string, string[]>;
  kpis: Record<string, string[]>;
  companies: Array<{company_name: string, symbol: string}>;
}

// Type for KPI selection with selected values
interface KPISelection {
  [kpi: string]: string[];
}

export default function IndexMakerPage() {
  const [countries, setCountries] = useState<Array<{country_code: string, country_name: string}>>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [industries, setIndustries] = useState<Record<string, string[]>>({});
  const [kpis, setKpis] = useState<Record<string, string[]>>({});
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<KPISelection>({});
  const [companies, setCompanies] = useState<Array<{company_name: string, symbol: string}>>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [indexSize, setIndexSize] = useState<number>(100);
  const [indexCurrency, setIndexCurrency] = useState<'USD' | 'EUR'>('USD');
  const [indexStartDate, setIndexStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [indexEndDate, setIndexEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showKPIDropdown, setShowKPIDropdown] = useState(false);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<Array<{company_name: string, symbol: string}>>([]);
  const [countryDropdownPosition, setCountryDropdownPosition] = useState({ top: 0, left: 0 });
  const [sectorDropdownPosition, setSectorDropdownPosition] = useState({ top: 0, left: 0 });
  const [industryDropdownPosition, setIndustryDropdownPosition] = useState({ top: 0, left: 0 });
  const [kpiDropdownPosition, setKpiDropdownPosition] = useState({ top: 0, left: 0 });
  const [stockSearchPosition, setStockSearchPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  

  // Function to calculate dropdown position
  const getDropdownPosition = (buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left
    };
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside all dropdowns and buttons
      if (!target.closest('.dropdown-container') && !target.closest('button')) {
        setShowCountryDropdown(false);
        setShowSectorDropdown(false);
        setShowIndustryDropdown(false);
        setShowKPIDropdown(false);
        setShowStockSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        setCompanies(data.companies || []);
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

  // Handle individual sector removal (from selected items display)
  const handleSectorRemove = (sector: string) => {
    setSelectedSectors(prev => prev.filter(s => s !== sector));
    // Also remove all industries associated with this sector
    setSelectedIndustries(prev => prev.filter(industry => !industries[sector]?.includes(industry)));
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
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {/* Left Panel - Index Maker Content */}
      <div style={{ width: '30%', padding: '16px', overflowY: 'auto', borderRight: '1px solid #e5e7eb', position: 'relative' }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            Index Maker
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            Create and manage custom stock indices by selecting sectors and industries
          </p>
          
                    {/* Index Size Slider */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Index Size
            </h3>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Top row: Label and Slider */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151',
                  minWidth: '60px'
                }}>
                  Stocks: {indexSize}
                </span>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={indexSize}
                  onChange={(e) => setIndexSize(parseInt(e.target.value))}
                  style={{
                    flex: '1',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#dbeafe',
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.background = '#dbeafe';
                  }}
                />
              </div>
              
              {/* Bottom row: Preset buttons */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={() => setIndexSize(10)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                  title="Set to 10"
                >
                  10
                </button>
                <button
                  onClick={() => setIndexSize(50)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                  title="Set to 50"
                >
                  50
                </button>
                <button
                  onClick={() => setIndexSize(100)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                  title="Set to 100"
                >
                  100
                </button>
                <button
                  onClick={() => setIndexSize(500)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                  title="Set to 500"
                >
                  500
                </button>
              </div>
            </div>
          </div>

          {/* Index Currency Selection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Index Currency
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '8px'
            }}>
                              <button
                  onClick={() => setIndexCurrency('USD')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: indexCurrency === 'USD' ? '#059669' : '#f3f4f6',
                    color: indexCurrency === 'USD' ? 'white' : '#374151',
                    border: indexCurrency === 'USD' ? '1px solid #059669' : '1px solid #d1d5db'
                  }}
                onMouseEnter={(e) => {
                  if (indexCurrency !== 'USD') {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (indexCurrency !== 'USD') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                USD
              </button>
              <button
                onClick={() => setIndexCurrency('EUR')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: indexCurrency === 'EUR' ? '#059669' : '#f3f4f6',
                  color: indexCurrency === 'EUR' ? 'white' : '#374151',
                  border: indexCurrency === 'EUR' ? '1px solid #059669' : '1px solid #d1d5db'
                }}
                onMouseEnter={(e) => {
                  if (indexCurrency !== 'EUR') {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (indexCurrency !== 'EUR') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                EUR
              </button>
            </div>
          </div>

          {/* Index Date Range Selection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Index Date Range
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center'
            }}>
              {/* Start Date */}
              <div style={{ flex: '1' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  marginBottom: '4px' 
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={indexStartDate}
                  onChange={(e) => setIndexStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* End Date */}
              <div style={{ flex: '1' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  marginBottom: '4px' 
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={indexEndDate}
                  onChange={(e) => setIndexEndDate(e.target.value)}
                  min={indexStartDate}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
            
            {/* Quick Date Presets */}
            <div style={{ 
              marginTop: '12px',
              display: 'flex', 
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setFullYear(endDate.getFullYear() - 1);
                  setIndexStartDate(startDate.toISOString().split('T')[0]);
                  setIndexEndDate(endDate.toISOString().split('T')[0]);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
                title="Last 1 year"
              >
                1Y
              </button>
              <button
                onClick={() => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setFullYear(endDate.getFullYear() - 3);
                  setIndexStartDate(startDate.toISOString().split('T')[0]);
                  setIndexEndDate(endDate.toISOString().split('T')[0]);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
                title="Last 3 years"
              >
                3Y
              </button>
              <button
                onClick={() => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setFullYear(endDate.getFullYear() - 5);
                  setIndexStartDate(startDate.toISOString().split('T')[0]);
                  setIndexEndDate(endDate.toISOString().split('T')[0]);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
                title="Last 5 years"
              >
                5Y
              </button>
              <button
                onClick={() => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setFullYear(endDate.getFullYear() - 10);
                  setIndexStartDate(startDate.toISOString().split('T')[0]);
                  setIndexEndDate(endDate.toISOString().split('T')[0]);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
                title="Last 10 years"
              >
                10Y
              </button>
            </div>
          </div>

          {/* Countries Selection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Countries
            </h3>
            <div style={{ position: 'relative' }}>
                          <button
              onClick={(e) => {
                const newState = !showCountryDropdown;
                if (newState) {
                  const position = getDropdownPosition(e.currentTarget);
                  setCountryDropdownPosition(position);
                }
                setShowCountryDropdown(newState);
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
                COUNTRIES ({selectedCountries.length} selected)
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ 
                    transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    marginLeft: 'auto'
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              {/* Country Dropdown */}
              {showCountryDropdown && (
                <div 
                  className="dropdown-container"
                  style={{
                    position: 'fixed',
                    top: countryDropdownPosition.top,
                    left: countryDropdownPosition.left,
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
                  {countries.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                      Loading countries... ({countries.length} loaded)
                    </div>
                  ) : (
                    countries.map((country) => {
                      const isSelected = selectedCountries.includes(country.country_code);
                      return (
                      <button
                        key={country.country_code}
                        onClick={() => handleCountryToggle(country.country_code)}
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
                          {country.country_name} - {country.country_code}
                        </span>
                      </button>
                    );
                  })
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Countries Display */}
            {selectedCountries.length > 0 && (
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
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                  <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '12px' }}>
                    Selected Countries ({selectedCountries.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedCountries.map((countryCode) => {
                    const country = countries.find(c => c.country_code === countryCode);
                    return (
                      <span
                        key={countryCode}
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
                        {country?.country_name || countryCode}
                        <button
                          onClick={() => {
                            setSelectedCountries(prev => prev.filter(c => c !== countryCode));
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
                          title="Remove this country"
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

          {/* Sectors Selection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>

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
                  className="dropdown-container"
                  style={{
                    position: 'fixed',
                    top: sectorDropdownPosition.top,
                    left: sectorDropdownPosition.left,
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
                          {isPartiallySelected && !isFullySelected && (
                            <div style={{ 
                              width: '6px', 
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
                            fontSize: '10px', 
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
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                  <span style={{ color: '#0c4a6e', fontWeight: '500', fontSize: '12px' }}>
                    Selected Sectors ({selectedSectors.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedSectors.map((sector) => (
                    <span
                      key={sector}
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
                          fontSize: '12px',
                          padding: '0',
                          marginLeft: '2px',
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

          {/* Industries Selection */}
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
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                  <span style={{ color: '#166534', fontWeight: '500', fontSize: '12px' }}>
                    Selected Industries ({selectedIndustries.length})
                  </span>
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

          {/* KPIs Selection */}
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

          {/* Stock Search */}
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
                  backgroundColor: '#dc2626',
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
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
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
                      Type at least 2 characters to search for companies
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
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                  <span style={{ color: '#991b1b', fontWeight: '500', fontSize: '12px' }}>
                    Selected Stocks ({selectedStocks.length})
                  </span>
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

          {/* Summary */}
          <div style={{ 
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Selection Summary
            </h3>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
              <strong>{selectedCountries.length}</strong> countries, <strong>{selectedSectors.length}</strong> sectors, <strong>{selectedIndustries.length}</strong> industries, <strong>{Object.keys(selectedKPIs).length}</strong> KPIs, and <strong>{selectedStocks.length}</strong> stocks selected
            </p>
            {Object.keys(selectedKPIs).length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
                <strong>Selected KPI values:</strong> {Object.values(selectedKPIs).flat().length} total values
              </div>
            )}
          </div>

          {/* Make Index Button */}
          <div style={{ 
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={async () => {
                try {
                  // Show loading state
                  const button = event?.currentTarget as HTMLButtonElement;
                  if (button) {
                    button.disabled = true;
                    button.innerHTML = `
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="animate-spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      CREATING INDEX...
                    `;
                  }

                  // Parse KPI values to extract first 2 characters (percentile numbers)
                  // and append "_perc" to field names for database querying
                  const parsedKPIs: Record<string, number[]> = {};
                  Object.entries(selectedKPIs).forEach(([kpiName, kpiValues]) => {
                    if (kpiValues && kpiValues.length > 0) {
                      // Append "_perc" to the KPI field name
                      const dbFieldName = `${kpiName}_perc`;
                      
                      parsedKPIs[dbFieldName] = kpiValues.map(value => {
                        // Extract first 2 characters and convert to number
                        const percentile = parseInt(value.toString().substring(0, 2));
                        return isNaN(percentile) ? 0 : percentile;
                      }).filter(percentile => percentile > 0); // Remove invalid values
                    }
                  });

                  // Prepare the request payload
                  const payload = {
                    indexSize,
                    indexCurrency,
                    indexStartDate,
                    indexEndDate,
                    selectedCountries,
                    selectedSectors,
                    selectedIndustries,
                    selectedKPIs: parsedKPIs, // Use parsed KPIs
                    selectedStocks
                  };

                  // Detailed console logging of all input values
                  console.log('🚀 MAKE INDEX BUTTON CLICKED!');
                  console.log('📊 Index Configuration:');
                  console.log('   • Size:', indexSize, 'stocks');
                  console.log('   • Currency:', indexCurrency);
                  console.log('   • Date Range:', indexStartDate, 'to', indexEndDate);
                  console.log('');
                  console.log('🌍 Selected Countries:', selectedCountries);
                  console.log('🏢 Selected Sectors:', selectedSectors);
                  console.log('🏭 Selected Industries:', selectedIndustries);
                  console.log('📈 Selected KPIs (Original):', selectedKPIs);
                  console.log('📈 Selected KPIs (Parsed with _perc):', parsedKPIs);
                  console.log('💼 Selected Stocks:', selectedStocks);
                  console.log('');
                  console.log('📦 Full Payload:', payload);
                  console.log('');

                  // Call the API
                  const response = await fetch('/api/create-index', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                  });

                  const result = await response.json();

                  if (response.ok) {
                    alert(`Index created successfully!\n\nResult: ${JSON.stringify(result.result, null, 2)}`);
                  } else {
                    alert(`Failed to create index: ${result.error}`);
                  }

                } catch (error) {
                  console.error('Index creation error:', error);
                  alert(`Error creating index: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  // Reset button state
                  const button = event?.currentTarget as HTMLButtonElement;
                  if (button) {
                    button.disabled = false;
                    button.innerHTML = `
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                      MAKE INDEX
                    `;
                  }
                }
              }}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '700',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#047857';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              MAKE INDEX
            </button>
            
            {/* Index Creation Summary */}
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
                <div><strong>Period:</strong> {indexStartDate} to {indexEndDate}</div>
                <div><strong>Countries:</strong> {selectedCountries.length}</div>
                <div><strong>KPIs:</strong> {Object.keys(selectedKPIs).length}</div>
                <div><strong>Stocks:</strong> {selectedStocks.length}</div>
              </div>
            </div>
          </div>

          {/* Empty Spacing Block */}
          <div style={{ 
            height: '200px',
            backgroundColor: 'transparent'
          }}></div>
        </div>
      </div>
      
      {/* Right Panel - Graph Area */}
      <div style={{ 
        width: '70%', 
        padding: '24px',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            style={{ marginBottom: '16px' }}
          >
            <path d="M3 3v18h18"/>
            <path d="m9 9 3 3 3-3"/>
            <path d="M9 12h6"/>
            <path d="M9 16h6"/>
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Graph Area
          </h3>
          <p style={{ fontSize: '14px', margin: '0' }}>
            Interactive charts and visualizations will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
