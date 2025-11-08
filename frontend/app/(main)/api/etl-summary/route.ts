import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

const baseUrl =
  process.env.STOCK_SERVICE_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  noStore();

  try {
    const response = await fetch(`${baseUrl}/api/etl-summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching ETL summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETL summary' },
      { status: 500 }
    );
  }
}
