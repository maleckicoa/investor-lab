import logging
import os
import pandas as pd

from .utils import run_query

def get_countries():
    country_query = "SELECT DISTINCT country FROM raw.stock_info WHERE COUNTRY IS NOT NULL"
    country_df = run_query(country_query)
    return country_df

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
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), 'fields'))
    from kpi_query import kpi_query
    
    kpi_df = run_query(kpi_query)
    return kpi_df

def get_companies():
    company_query = "select distinct company_name, symbol from raw.stock_info WHERE relevant = true"
    company_df = run_query(company_query)
    return company_df

def update_fields_file(countries_df, sectors_df, industries_df, kpis_df, companies_df):
    # Create fields directory if it doesn't exist
    fields_dir = os.path.join(os.path.dirname(__file__), 'fields')
    os.makedirs(fields_dir, exist_ok=True)
    
    # Write countries to CSV
    if not countries_df.empty:
        countries_csv_path = os.path.join(fields_dir, 'countries.csv')
        countries_df.to_csv(countries_csv_path, index=False)
        print(f"✅ Wrote {len(countries_df)} countries to {countries_csv_path}")
    
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
    
    print(f"✅ Field generation complete! Created CSV files in {fields_dir}")
    return countries_df, sectors_df, industries_df, kpis_df, companies_df

def main():
    countries = get_countries()
    sectors = get_sectors()
    industries = get_industries()
    kpis = get_kpis()
    companies = get_companies()
    update_fields_file(countries, sectors, industries, kpis, companies)
    print("✅ Field generation complete!")

if __name__ == "__main__":
    main()