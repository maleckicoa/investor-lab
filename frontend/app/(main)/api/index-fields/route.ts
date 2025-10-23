import { NextResponse } from 'next/server';

// Cache frontend-proxied index fields for 1 hour and revalidate in background
export const revalidate = 3600; // seconds

export async function GET() {

  try {
    const response = await fetch('http://localhost:8000/api/index-fields', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Allow Next to cache this response at the app layer
      // Use Next's ISR-style metadata so prefetch warms cache
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        // Help browsers/CDN cache where applicable; Next will also cache via revalidate
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error: any) {
    console.error('Error fetching index fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch index fields' },
      { status: 500 }
    );
  }
}
