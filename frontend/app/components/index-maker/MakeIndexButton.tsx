import React from 'react';

interface MakeIndexButtonProps {
  indexSize: number;
  indexCurrency: 'USD' | 'EUR';
  indexStartAmount: number;
  indexStartDate: string;
  indexEndDate: string;
  selectedCountries: string[];
  selectedSectors: string[];
  selectedIndustries: string[];
  selectedKPIs: Record<string, string[]>;
  selectedStocks: string[];
  isCreatingIndex: boolean;
  creationSeconds: number;
  setIsCreatingIndex: React.Dispatch<React.SetStateAction<boolean>>;
  setCreationSeconds: React.Dispatch<React.SetStateAction<number>>;
  setIndexResult: (result: any) => void;
  setIndexRiskReturn?: (rr: { risk: number; return: number } | null) => void;
}

const MakeIndexButton: React.FC<MakeIndexButtonProps> = ({
  indexSize,
  indexCurrency,
  indexStartAmount,
  indexStartDate,
  indexEndDate,
  selectedCountries,
  selectedSectors,
  selectedIndustries,
  selectedKPIs,
  selectedStocks,
  isCreatingIndex,
  creationSeconds,
  setIsCreatingIndex,
  setCreationSeconds,
  setIndexResult,
  setIndexRiskReturn,
}) => {
  const handleClick = async () => {
    try {
      if (selectedCountries.length === 0) {
        alert('Please select at least 1 country before creating an index.');
        return;
      }
      if (selectedSectors.length === 0) {
        alert('Please select at least 1 sector before creating an index.');
        return;
      }
      if (selectedIndustries.length === 0) {
        alert('Please select at least 1 industry before creating an index.');
        return;
      }

      setIsCreatingIndex(true);
      setCreationSeconds(0);

      const parsedKPIs: Record<string, string[]> = {};
      Object.entries(selectedKPIs).forEach(([kpiName, kpiValues]) => {
        if (kpiValues && kpiValues.length > 0) {
          const dbFieldName = `${kpiName}_perc`;
          parsedKPIs[dbFieldName] = kpiValues
            .map((value) => {
              const s = String(value).trim();
              const gtMatch = s.match(/^>\s*=?\s*(\d+)/);
              if (gtMatch) {
                const n = parseInt(gtMatch[1], 10);
                if (!isNaN(n)) {
                  return String(Math.min(n >= 99 ? 100 : n + 1, 100));
                }
              }
              const firstFour = s.substring(0, 4);
              const numbersOnly = firstFour.replace(/[^0-9]/g, '');
              const n = parseInt(numbersOnly, 10);
              if (isNaN(n)) return '';
              return String(Math.min(n, 100));
            })
            .filter((v) => v.length > 0);
        }
      });

      const payload = {
        indexSize,
        indexCurrency,
        indexStartAmount,
        indexStartDate,
        indexEndDate,
        selectedCountries,
        selectedSectors,
        selectedIndustries,
        selectedKPIs: parsedKPIs,
        selectedStocks,
      };

      console.log('🚀 MAKE INDEX BUTTON CLICKED!');
      console.log('📊 Index Configuration:');
      console.log('   • Size:', indexSize, 'stocks');
      console.log('   • Currency:', indexCurrency);
      console.log('   • Start Amount:', indexStartAmount);
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

      const response = await fetch('/api/create-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Index created successfully:', result.result);
        console.log('🔍 DEBUG - Index data received:', result.result.index_data?.slice(0, 3));
        console.log('🔍 DEBUG - Total data points:', result.result.total_data_points);
        console.log('🔍 DEBUG - Constituent weights received:', result.result.constituent_weights?.slice(0, 5));
        console.log('🔍 DEBUG - Constituent weights type:', typeof result.result.constituent_weights);
        console.log('🔍 DEBUG - Constituent weights length:', result.result.constituent_weights?.length);
        setIndexResult(result.result);
        if (setIndexRiskReturn) {
          const rr = result?.result?.risk_return;
          if (rr && typeof rr.risk === 'number' && typeof rr.return === 'number') {
            setIndexRiskReturn({ risk: rr.risk, return: rr.return });
          } else {
            setIndexRiskReturn(null);
          }
        }
      } else {
        alert(`Failed to create index: ${result.error}`);
      }
    } catch (error) {
      console.error('Index creation error:', error);
      alert(`Error creating index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingIndex(false);
      setCreationSeconds(0);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCreatingIndex}
      style={{
        width: '100%',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '700',
        backgroundColor: isCreatingIndex ? '#6b7280' : '#059669',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isCreatingIndex ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}
      onMouseEnter={(e) => {
        if (!isCreatingIndex) {
          e.currentTarget.style.backgroundColor = '#047857';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isCreatingIndex) {
          e.currentTarget.style.backgroundColor = '#059669';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {isCreatingIndex ? (
        <>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          CREATING INDEX... ({creationSeconds}s)
        </>
      ) : (
        <>
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
        </>
      )}
    </button>
  );
};

export default MakeIndexButton;
