import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Helper function to parse CSV content
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

export async function GET() {
  noStore();

  try {
    // Path to the fields directory in stock-service
    const fieldsDir = join(process.cwd(), '..', 'stock-service', 'src', 'utils', 'fields');
    
    // Read countries from CSV
    let countries: string[] = [];
    try {
      const countriesPath = join(fieldsDir, 'countries.csv');
      const countriesContent = readFileSync(countriesPath, 'utf-8');
      const countriesData = parseCSV(countriesContent);
      countries = countriesData.map(row => row.country).filter(Boolean);
    } catch (error) {
      console.warn('Could not read countries.csv:', error);
    }

    // Read sectors from CSV
    let sectors: string[] = [];
    try {
      const sectorsPath = join(fieldsDir, 'sectors.csv');
      const sectorsContent = readFileSync(sectorsPath, 'utf-8');
      const sectorsData = parseCSV(sectorsContent);
      sectors = sectorsData.map(row => row.sector).filter(Boolean);
    } catch (error) {
      console.warn('Could not read sectors.csv:', error);
    }

    // Read industries from CSV
    let industries: Record<string, string[]> = {};
    try {
      const industriesPath = join(fieldsDir, 'industries.csv');
      const industriesContent = readFileSync(industriesPath, 'utf-8');
      const industriesData = parseCSV(industriesContent);
      
      industriesData.forEach((row: any) => {
        const { sector, industry } = row;
        if (sector && industry) {
          if (!industries[sector]) {
            industries[sector] = [];
          }
          industries[sector].push(industry);
        }
      });
    } catch (error) {
      console.warn('Could not read industries.csv:', error);
    }

    // Read KPIs from CSV
    let kpis: Record<string, string[]> = {};
    try {
      const kpisPath = join(fieldsDir, 'kpis.csv');
      const kpisContent = readFileSync(kpisPath, 'utf-8');
      const kpisData = parseCSV(kpisContent);
      
      // Group KPIs by name with their potential values
      kpisData.forEach((row: any) => {
        const { kpi_name, kpi_value } = row;
        if (kpi_name && kpi_value) {
          if (!kpis[kpi_name]) {
            kpis[kpi_name] = [];
          }
          if (!kpis[kpi_name].includes(kpi_value)) {
            kpis[kpi_name].push(kpi_value);
          }
        }
      });
    } catch (error) {
      console.warn('Could not read kpis.csv:', error);
    }

    return NextResponse.json(
      { 
        countries,
        sectors,
        industries,
        kpis
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (e: any) {
    console.error('Index Fields API Error:', e);
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
