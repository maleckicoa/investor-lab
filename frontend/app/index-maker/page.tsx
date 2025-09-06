'use client';

import { useState, useEffect } from 'react';
import IndexSizeSlider from '../components/index-maker/IndexSizeSlider';
import CurrencyAndStartAmount from '../components/index-maker/CurrencyAndStartAmount';
import DateRangePicker from '../components/index-maker/DateRangePicker';
import CountrySelector from '../components/index-maker/CountrySelector';
import SectorSelector from '../components/index-maker/SectorSelector';
import IndustrySelector from '../components/index-maker/IndustrySelector';
import KPISelector from '../components/index-maker/KPISelector';
import StockSearch from '../components/index-maker/StockSearch';
import SelectionSummary from '../components/index-maker/SelectionSummary';
import MakeIndexButton from '../components/index-maker/MakeIndexButton';
import IndexCreationSummary from '../components/index-maker/IndexCreationSummary';
import IndexLineChart from '../components/index-maker/IndexLineChart';
import ConstituentWeightsTable from '../components/index-maker/ConstituentWeightsTable';
import BenchmarkSelector from '../components/index-maker/BenchmarkSelector';

// Types for the API response
interface IndexFields {
  countries: Array<{country_code: string, country_name: string}>;
  sectors: string[];
  industries: Record<string, string[]>;
  kpis: Record<string, string[]>;
  companies: Array<{company_name: string, symbol: string}>;
  benchmarks: Array<{name: string, symbol: string, type: string, date: string}>;
}

// Type for KPI selection with selected values
interface KPISelection {
  [kpi: string]: string[];
}

export default function IndexMakerPage() {
  const [countries, setCountries] = useState<Array<{country_code: string, country_name: string}>>([]);
  const [sectors, setSectors] = useState<string[]>(['Technology']);
  const [industries, setIndustries] = useState<Record<string, string[]>>({});
  const [kpis, setKpis] = useState<Record<string, string[]>>({});
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['US']);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Technology']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<KPISelection>({});
  const [companies, setCompanies] = useState<Array<{company_name: string, symbol: string}>>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<Array<{name: string, symbol: string, type: string, date: string}>>([]);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['SPY', 'SMH', '^NDX', '^GDAXI']);
  const [indexSize, setIndexSize] = useState<number>(100);
  const [indexCurrency, setIndexCurrency] = useState<'USD' | 'EUR'>('USD');
  const [indexStartAmount, setIndexStartAmount] = useState<number>(1000);
  const [indexStartDate, setIndexStartDate] = useState<string>('2014-01-01');
  const [indexEndDate, setIndexEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  // Ensure end date is never before start date
  useEffect(() => {
    if (indexEndDate < indexStartDate) {
      setIndexEndDate(indexStartDate);
    }
  }, [indexStartDate]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showKPIDropdown, setShowKPIDropdown] = useState(false);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [showBenchmarkDropdown, setShowBenchmarkDropdown] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<Array<{company_name: string, symbol: string}>>([]);
  const [countryDropdownPosition, setCountryDropdownPosition] = useState({ top: 0, left: 0 });
  const [sectorDropdownPosition, setSectorDropdownPosition] = useState({ top: 0, left: 0 });
  const [industryDropdownPosition, setIndustryDropdownPosition] = useState({ top: 0, left: 0 });
  const [kpiDropdownPosition, setKpiDropdownPosition] = useState({ top: 0, left: 0 });
  const [stockSearchPosition, setStockSearchPosition] = useState({ top: 0, left: 0 });
  const [benchmarkDropdownPosition, setBenchmarkDropdownPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Spinner state for index creation
  const [isCreatingIndex, setIsCreatingIndex] = useState(false);
  const [creationSeconds, setCreationSeconds] = useState(0);
  
    // Index results state
  const [indexResult, setIndexResult] = useState<any>(null);
  


////////////////////////////////////
// Prefill the Sector and Industries
  const [didPrefillSector, setDidPrefillSector] = useState<boolean>(false);
  
  useEffect(() => {
    if (!didPrefillSector && industries && Object.keys(industries).length > 0) {
      // Ensure Technology is selected
      setSelectedSectors(prev => prev.includes('Technology') ? prev : [...prev, 'Technology']);
      // Merge Technology industries into selectedIndustries
      const techIndustries = industries['Technology'] || [];
      if (techIndustries.length > 0) {
        setSelectedIndustries(prev => Array.from(new Set([...(prev || []), ...techIndustries])));
      }
      setDidPrefillSector(true);
    }
  }, [industries, didPrefillSector]);
  /////////////////////


  // Timer effect for index creation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCreatingIndex) {
      interval = setInterval(() => {
        setCreationSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCreatingIndex]);
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
        setShowBenchmarkDropdown(false);
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
        setBenchmarks(data.benchmarks || []);
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
      // Also ensure the sector of this industry is selected
      const sectorOfIndustry = Object.keys(industries).find(
        (sector) => (industries[sector] || []).includes(industry)
      );
      if (sectorOfIndustry && !selectedSectors.includes(sectorOfIndustry)) {
        setSelectedSectors(prev => [...prev, sectorOfIndustry as string]);
      }
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

  // Handle benchmark selection/deselection
  const handleBenchmarkToggle = (benchmark: string) => {
    if (selectedBenchmarks.includes(benchmark)) {
      setSelectedBenchmarks(prev => prev.filter(b => b !== benchmark));
    } else {
      setSelectedBenchmarks(prev => [...prev, benchmark]);
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
    <div className="page-container" style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {/* Left Panel - Index Maker Content */}
      <div className="left-pane" style={{ width: '25%', padding: '24px', overflowY: 'auto', borderRight: '1px solid #e5e7eb', position: 'relative' }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '20px', width: '100%',  }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            Index Maker
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            Create and manage custom stock indices by selecting sectors and industries
          </p>
          
                    {/* Index Size Slider */}
          <IndexSizeSlider value={indexSize} onChange={setIndexSize} />

          {/* Index Currency and Start Amount Selection */}
          <CurrencyAndStartAmount
            indexCurrency={indexCurrency}
            setIndexCurrency={setIndexCurrency}
            indexStartAmount={indexStartAmount}
            setIndexStartAmount={setIndexStartAmount}
          />

          {/* Index Date Range Selection */}
          <DateRangePicker
            indexStartDate={indexStartDate}
            setIndexStartDate={setIndexStartDate}
            indexEndDate={indexEndDate}
            setIndexEndDate={setIndexEndDate}
          />

          {/* Countries Selection */}
          <CountrySelector
            countries={countries}
            selectedCountries={selectedCountries}
            setSelectedCountries={setSelectedCountries}
            showCountryDropdown={showCountryDropdown}
            setShowCountryDropdown={setShowCountryDropdown}
            countryDropdownPosition={countryDropdownPosition}
            setCountryDropdownPosition={setCountryDropdownPosition}
            getDropdownPosition={getDropdownPosition}
            handleCountryToggle={handleCountryToggle}
          />

          {/* Sectors Selection */}
          <SectorSelector
            sectors={sectors}
            selectedSectors={selectedSectors}
            setSelectedSectors={setSelectedSectors}
            selectedIndustries={selectedIndustries}
            setSelectedIndustries={setSelectedIndustries}
            industries={industries}
            showSectorDropdown={showSectorDropdown}
            setShowSectorDropdown={setShowSectorDropdown}
            sectorDropdownPosition={sectorDropdownPosition}
            setSectorDropdownPosition={setSectorDropdownPosition}
            getDropdownPosition={getDropdownPosition}
            handleSectorToggle={handleSectorToggle}
            handleSectorRemove={handleSectorRemove}
            isSectorFullySelected={isSectorFullySelected}
            isSectorPartiallySelected={isSectorPartiallySelected}
          />

          {/* Industries Selection */}
          <IndustrySelector
            industries={industries}
            selectedIndustries={selectedIndustries}
            setSelectedIndustries={setSelectedIndustries}
            selectedSectors={selectedSectors}
            setSelectedSectors={setSelectedSectors}
            showIndustryDropdown={showIndustryDropdown}
            setShowIndustryDropdown={setShowIndustryDropdown}
            industryDropdownPosition={industryDropdownPosition}
            setIndustryDropdownPosition={setIndustryDropdownPosition}
            getDropdownPosition={getDropdownPosition}
            handleIndustryToggle={handleIndustryToggle}
          />

          {/* KPIs Selection */}
          <KPISelector
            kpis={kpis}
            selectedKPIs={selectedKPIs}
            setSelectedKPIs={setSelectedKPIs}
            showKPIDropdown={showKPIDropdown}
            setShowKPIDropdown={setShowKPIDropdown}
            kpiDropdownPosition={kpiDropdownPosition}
            setKpiDropdownPosition={setKpiDropdownPosition}
            getDropdownPosition={getDropdownPosition}
          />

          {/* Stock Search */}
          <StockSearch
            companies={companies}
            selectedStocks={selectedStocks}
            setSelectedStocks={setSelectedStocks}
            showStockSearch={showStockSearch}
            setShowStockSearch={setShowStockSearch}
            stockSearchPosition={stockSearchPosition}
            setStockSearchPosition={setStockSearchPosition}
            stockSearchQuery={stockSearchQuery}
            setStockSearchQuery={setStockSearchQuery}
            stockSearchResults={stockSearchResults}
            setStockSearchResults={setStockSearchResults}
            getDropdownPosition={getDropdownPosition}
          />

          {/* Summary */}
          <SelectionSummary
            selectedCountriesCount={selectedCountries.length}
            selectedSectorsCount={selectedSectors.length}
            selectedIndustriesCount={selectedIndustries.length}
            selectedKPIs={selectedKPIs}
            selectedStocksCount={selectedStocks.length}
          />

          {/* Make Index Button */}
                        <div style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <MakeIndexButton
              indexSize={indexSize}
              indexCurrency={indexCurrency}
              indexStartAmount={indexStartAmount}
              indexStartDate={indexStartDate}
              indexEndDate={indexEndDate}
              selectedCountries={selectedCountries}
              selectedSectors={selectedSectors}
              selectedIndustries={selectedIndustries}
              selectedKPIs={selectedKPIs}
              selectedStocks={selectedStocks}
              isCreatingIndex={isCreatingIndex}
              creationSeconds={creationSeconds}
              setIsCreatingIndex={setIsCreatingIndex}
              setCreationSeconds={setCreationSeconds}
              setIndexResult={setIndexResult}
            />
            
            <IndexCreationSummary
              indexSize={indexSize}
              indexCurrency={indexCurrency}
              indexStartAmount={indexStartAmount}
              indexStartDate={indexStartDate}
              indexEndDate={indexEndDate}
              countriesCount={selectedCountries.length}
              kpiCategoriesCount={Object.keys(selectedKPIs).length}
              stocksCount={selectedStocks.length}
            />
                        </div>
                        
          {/* Empty Spacing Block */}
                        <div style={{
            height: '200px',
            backgroundColor: 'transparent'
          }}></div>
                                </div>
            </div>
            
      {/* Middle Panel - Graph Area */}
      <div className="middle-pane" style={{ 
        width: '50%', 
        padding: '24px',
        backgroundColor: '#f8fafc',
        borderLeft: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {/* Index Results Header */}
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="m9 9 3 3 3-3"/>
                <path d="M9 12h6"/>
                <path d="M9 16h6"/>
              </svg>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0' }}>
                Index Results
              </h2>
              {indexResult && (
                <button
                  onClick={() => setIndexResult(null)}
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    color: '#dc2626',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }}
                >
                  Clear Results
                </button>
              )}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              fontSize: '14px'
            }}>
              <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' }}>
                <div style={{ fontWeight: '600', color: '#0c4a6e', marginBottom: '4px' }}>Total Data Points</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0ea5e9' }}>
                  {indexResult ? indexResult.total_data_points : '--'}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #22c55e' }}>
                <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>Constituent Weights</div>
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '6px' }}>Years and quarters included</div>
                {indexResult ? (() => {
                  const weights = (indexResult && indexResult.constituent_weights) ? indexResult.constituent_weights : {};
                  const years = Object.keys(weights || {}).length;
                  const quarters = Object.values(weights || {}).reduce((acc: number, q: any) => acc + Object.keys(q as any).length, 0);
                  return (
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>{years} yrs • {quarters} qtrs</div>
                  );
                })() : (
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>--</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Index Data Display */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0' }}>
                Index Value (Line Chart)
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>Showing index over time</p>
            </div>

            <div className="chart-container" style={{ 
              padding: '20px 20px 20px 20px',
              overflowX: 'auto',
              overflowY: 'hidden'
            }}>
              {indexResult ? (
                <IndexLineChart
                  data={indexResult?.index_data || []}
                  width={750}
                  height={320}
                  startValue={indexStartAmount}
                />
              ) : (
                <div style={{ 
                  height: '320px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                      <path d="M3 3v18h18"/>
                      <path d="m9 9 3 3 3-3"/>
                      <path d="M9 12h6"/>
                      <path d="M9 16h6"/>
                    </svg>
                    <p style={{ fontSize: '14px', margin: '0' }}>No data to display</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Constituent Weights Table */}
          <div style={{ 
            marginTop: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0' }}>
                Constituent Weights by Quarter
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>Columns are Year/Quarter from oldest to latest. Rows are constituents sorted by weight in the latest period.</p>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {indexResult ? (
                <ConstituentWeightsTable weights={indexResult?.constituent_weights || []} />
              ) : (
                <div style={{ 
                  height: '200px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                      <path d="M3 3v18h18"/>
                      <path d="m9 9 3 3 3-3"/>
                      <path d="M9 12h6"/>
                      <path d="M9 16h6"/>
                    </svg>
                    <p style={{ fontSize: '14px', margin: '0' }}>No data to display</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Benchmark Selector */}
      <div className="right-pane" style={{ 
        width: '25%', 
        padding: '24px',
        backgroundColor: '#f8fafc',
        borderLeft: '1px solid #e5e7eb',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '20px', width: '100%' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            Benchmark Selection
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            Select benchmarks to compare against your index
          </p>
          
          <BenchmarkSelector
            benchmarks={benchmarks}
            selectedBenchmarks={selectedBenchmarks}
            setSelectedBenchmarks={setSelectedBenchmarks}
            showBenchmarkDropdown={showBenchmarkDropdown}
            setShowBenchmarkDropdown={setShowBenchmarkDropdown}
            benchmarkDropdownPosition={benchmarkDropdownPosition}
            setBenchmarkDropdownPosition={setBenchmarkDropdownPosition}
            getDropdownPosition={getDropdownPosition}
            handleBenchmarkToggle={handleBenchmarkToggle}
          />
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .page-container {
            flex-direction: column;
            height: auto;
          }
          .left-pane {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb;
            max-height: 33vh;
            overflow-y: auto;
          }
          .middle-pane {
            width: 100% !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb;
            min-height: 33vh;
          }
          .right-pane {
            width: 100% !important;
            border-left: none !important;
            min-height: 33vh;
          }
          
          .chart-container {
            padding: 10px !important;
          }
          
          .chart-container svg {
            max-width: 100% !important;
            height: auto !important;
          }
          
          .chart-container {
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
          
          .chart-container::-webkit-scrollbar {
            height: 8px;
          }
          
          .chart-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .chart-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          
          .chart-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        }
        
        @media (max-width: 1024px) {
          .chart-container {
            padding: 15px !important;
          }
        }
        
        @media (max-width: 768px) {
          .chart-container {
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
