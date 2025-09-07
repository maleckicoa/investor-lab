import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  noStore();

  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const startAmount = searchParams.get('startAmount');
    const currency = searchParams.get('currency');

    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbolsArray = symbols.split(',');
    
    // Build query parameters for the backend
    const queryParams = new URLSearchParams({
      symbols: symbols,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(startAmount && { startAmount }),
      ...(currency && { currency })
    });

    const response = await fetch(`http://localhost:8000/api/benchmark-data?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching benchmark data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark data' },
      { status: 500 }
    );
  }
}
