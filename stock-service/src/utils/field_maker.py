import logging
import os
import pandas as pd
import sys

from src.utils.fields_utils import kpi_query, country_codes
from src.utils.utils import run_query
from src.utils.benchmark_utils import calculate_benchmark_risk_return

def get_countries():
    
    country_query = "SELECT DISTINCT country FROM raw.stock_info WHERE COUNTRY IS NOT NULL"
    country_df = run_query(country_query)
    
    # Map country codes to country names
    if not country_df.empty:
        # Create a new dataframe with the mapped data
        mapped_countries = []
        for _, row in country_df.iterrows():
            country_code = row['country']
            country_name = country_codes.get(country_code, country_code)  # fallback to code if no mapping
            mapped_countries.append({
                'country_name': country_name,
                'country_code': country_code
                
            })
        result_df = pd.DataFrame(mapped_countries).sort_values(by='country_name')
    
    return result_df

def get_sectors():
    sector_query = "SELECT DISTINCT sector FROM raw.stock_info WHERE SECTOR IS NOT NULL"
    sector_df = run_query(sector_query)
    return sector_df

def get_industries():
    industry_query = """
    select sector, industry, count (*) as count
    from raw.stock_info si 
    where (
    sector is not null and 
    industry is not null)
    group by sector, industry
    having count (*) >1
    order by sector, industry
    """
    industry_df = run_query(industry_query)
    return industry_df

def get_kpis():
    # Import the query from the existing file
    kpi_df = run_query(kpi_query)
    kpi_df['kpi_name'] = (kpi_df['kpi_name']
        .astype(str)
        .str.replace('_', ' ', regex=False)
        .str.title()
    )
    return kpi_df

def get_companies():
    company_query = "select distinct company_name, symbol from raw.stock_info WHERE relevant = true"
    company_df = run_query(company_query)
    
    # Clean up company names by removing quotes and commas
    if not company_df.empty:
        company_df['company_name'] = company_df['company_name'].astype(str).str.replace('"', '', regex=False).str.replace(',', '', regex=False)
    
    return company_df

def get_benchmarks():
    benchmark_query = """
    SELECT 
        name,
        symbol,
        type,
        date,
        close_eur,
        close_usd
    FROM raw.benchmarks 
    WHERE name IS NOT NULL
    ORDER BY type, name
    """
    benchmark_df = run_query(benchmark_query)

    unique_benchmarks = benchmark_df[['name', 'symbol', 'type']].drop_duplicates()
    processed_benchmarks = []
    
    # Process each unique benchmark
    for _, row in unique_benchmarks.iterrows():
        symbol = row['symbol']
        
        symbol_data = benchmark_df[benchmark_df['symbol'] == symbol]
        risk_return = calculate_benchmark_risk_return(symbol_data)
        min_date = symbol_data['date'].min()
        
        benchmark_record = {
            'name': row['name'],
            'symbol': symbol,
            'type': row['type'],
            'date': min_date,
            'return_eur': risk_return['return_eur'],
            'return_usd': risk_return['return_usd'],
            'risk_eur': risk_return['risk_eur'],
            'risk_usd': risk_return['risk_usd']
        }
        processed_benchmarks.append(benchmark_record)
    
    result_df = pd.DataFrame(processed_benchmarks)    
    return result_df

def update_fields_file(countries_df, sectors_df, industries_df, kpis_df, companies_df, benchmarks_df):
    # Create fields directory if it doesn't exist
    fields_dir = os.path.join(os.path.dirname(__file__), 'fields')
    os.makedirs(fields_dir, exist_ok=True)
    
    # Write countries to CSV
    if not countries_df.empty:
        countries_csv_path = os.path.join(fields_dir, 'countries.csv')
        # Ensure we have the correct column structure
        if 'country_code' in countries_df.columns and 'country_name' in countries_df.columns:
            countries_df.to_csv(countries_csv_path, index=False)
            print(f"✅ Wrote {len(countries_df)} countries to {countries_csv_path}")
        else:
            print("❌ Countries dataframe missing required columns: country_code, country_name")
            print(f"Available columns: {list(countries_df.columns)}")
    
    # Write sectors to CSV
    if not sectors_df.empty:
        sectors_csv_path = os.path.join(fields_dir, 'sectors.csv')
        sectors_df.to_csv(sectors_csv_path, index=False)
        print(f"✅ Wrote {len(sectors_df)} sectors to {sectors_csv_path}")
    
    # Write industries to CSV
    if not industries_df.empty:
        industries_csv_path = os.path.join(fields_dir, 'industries.csv')
        industries_df.to_csv(industries_csv_path, index=False)
        print(f"✅ Wrote {len(industries_df)} industry records to {industries_csv_path}")
    
    # Write KPIs to CSV
    if not kpis_df.empty:
        kpis_csv_path = os.path.join(fields_dir, 'kpis.csv')
        kpis_df.to_csv(kpis_csv_path, index=False)
        print(f"✅ Wrote {len(kpis_df)} KPI records to {kpis_csv_path}")
    
    # Write companies to CSV
    if not companies_df.empty:
        companies_csv_path = os.path.join(fields_dir, 'companies.csv')
        companies_df.to_csv(companies_csv_path, index=False)
        print(f"✅ Wrote {len(companies_df)} companies to {companies_csv_path}")
    
    # Write benchmarks to CSV
    if not benchmarks_df.empty:
        benchmarks_csv_path = os.path.join(fields_dir, 'benchmarks.csv')
        benchmarks_df.to_csv(benchmarks_csv_path, index=False)
        print(f"✅ Wrote {len(benchmarks_df)} benchmarks to {benchmarks_csv_path}")
    
    print(f"✅ Field generation complete! Created CSV files in {fields_dir}")
    return countries_df, sectors_df, industries_df, kpis_df, companies_df, benchmarks_df

def main():
    countries = get_countries()
    sectors = get_sectors()
    industries = get_industries()
    kpis = get_kpis()
    companies = get_companies()
    benchmarks = get_benchmarks()
    update_fields_file(countries, sectors, industries, kpis, companies, benchmarks)
if __name__ == "__main__":
    main()