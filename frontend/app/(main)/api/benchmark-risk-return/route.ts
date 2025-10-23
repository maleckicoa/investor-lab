import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  noStore();
  try {
    const resp = await fetch('http://localhost:8000/api/benchmark-risk-return', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch risk/return' }, { status: 500 });
  }
}


