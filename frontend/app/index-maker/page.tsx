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
import MakeIndexButton from '../components/index-maker/MakeIndexButton';
import IndexCreationSummary from '../components/index-maker/IndexCreationSummary';
import UserInstructions from '../components/index-maker/UserInstructions';
import IndexLineChart from '../components/index-maker/IndexLineChart';
import ConstituentWeightsTable from '../components/index-maker/ConstituentWeightsTable';
import BenchmarkSelector from '../components/index-maker/BenchmarkSelector';
import { useRef } from 'react';
import RiskReturnSection from '../components/index-maker/RiskReturnSection';
import IndexResults from '../components/index-maker/IndexResults';

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
  const [riskReturnData, setRiskReturnData] = useState<any[]>([]);
  const [indexRiskReturn, setIndexRiskReturn] = useState<{ risk: number; return: number } | null>(null);
  const [riskReturnZoom, setRiskReturnZoom] = useState<number>(1);
  const rrRef = useRef<any>(null);
  
  // Spinner state for index creation
  const [isCreatingIndex, setIsCreatingIndex] = useState(false);
  const [creationSeconds, setCreationSeconds] = useState(0);
  
    // Index results state
  const [indexResult, setIndexResult] = useState<any>(null);
  
  // Benchmark data state
  const [benchmarkData, setBenchmarkData] = useState<{ [symbol: string]: Array<{ date: string; value: number }> }>({});
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  


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
        // fetch risk/return data in parallel route
        try {
          const rr = await fetch('/api/benchmark-risk-return');
          if (rr.ok) {
            const js = await rr.json();
            setRiskReturnData(js.benchmarks || []);
          }
        } catch {}
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

  // Fetch benchmark data
  const fetchBenchmarkData = async (symbols: string[]) => {
    if (symbols.length === 0) {
      setBenchmarkData({});
      return;
    }

    try {
      setLoadingBenchmarks(true);
      const symbolsParam = symbols.join(',');
      const response = await fetch(`/api/benchmark-data?symbols=${symbolsParam}&startDate=${indexStartDate}&endDate=${indexEndDate}&startAmount=${indexStartAmount}&currency=${indexCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setBenchmarkData(data);
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
      setBenchmarkData({});
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  // Fetch benchmark data when selected benchmarks change
  useEffect(() => {
    fetchBenchmarkData(selectedBenchmarks);
  }, [selectedBenchmarks, indexStartDate, indexEndDate, indexStartAmount, indexCurrency]);

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
          <p style={{ color: '#6b7280' }}>Loading Index Maker...</p>
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
    <div className="page-container" style={{ display: 'flex', width: '100%', height: '100vh', justifyContent: 'center', padding: '0 10vw' }}>
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {/* Left Panel - Index Maker Content */}
      <div className="left-pane" style={{ width: '30%', padding: '24px', overflowY: 'auto', borderRight: '1px solid #e5e7eb', position: 'relative' }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '20px', width: '100%',  }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Index Maker
            </h2>
            <div style={{ marginLeft: 'auto' }}>
              <UserInstructions />
            </div>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            &nbsp;
            &nbsp;
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

          {/* Benchmarks */}
          <div style={{ marginTop: '12px' }}>
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

          {/* Summary removed */}

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
              setIndexRiskReturn={setIndexRiskReturn}
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
            
      {/* Right Panel - Graph Area */}
      <div className="right-pane" style={{ 
        width: '70%',
        padding: '24px',
        backgroundColor: '#f8fafc',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ width: '100%' }}>
          <IndexResults indexResult={indexResult} indexRiskReturn={indexRiskReturn} onClear={() => { setIndexResult(null); setIndexRiskReturn(null); }} />
          
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
                Index & Benchmark Chart
              </h3>
            </div>

            <div className="chart-container" style={{ 
              padding: '20px 20px 20px 20px',
              overflowX: 'auto',
              overflowY: 'hidden'
            }}>
              {indexResult ? (
                <IndexLineChart
                  data={indexResult?.index_data || []}
                  benchmarkData={benchmarkData}
                  width={undefined}
                  height={360}
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

          {/* Risk Return */}
          <RiskReturnSection
            riskReturnData={riskReturnData}
            indexCurrency={indexCurrency}
            riskReturnZoom={riskReturnZoom}
            setRiskReturnZoom={setRiskReturnZoom}
            indexRiskReturn={indexRiskReturn}
          />

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
          .right-pane {
            width: 100% !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb;
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

