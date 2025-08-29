import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import pool from '@/lib/db';
import { ETLSummary } from '@/types/etl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store'; // <- disable fetch cache for this segment

export async function GET() {
  noStore(); // <- opt out of Next's caching for this request

  try {
    const result = await pool.query(`
      SELECT 
        date, day,
        fx_cnt, close_cnt, vol_cnt,
        close_eur_cnt, close_usd_cnt,
        vol_eur_cnt, vol_usd_cnt,
        mcap_cnt, mcap_eur_cnt, mcap_usd_cnt,
        created_at
      FROM raw.etl_summary
      ORDER BY date DESC
    `);

    console.log('🔍 ETL Summary API Debug:');
    console.log('Raw database result:', result.rows);
    console.log('Number of rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('First row (latest):', result.rows[0]);
      console.log('Last row (oldest):', result.rows[result.rows.length - 1]);
    }

    const data: ETLSummary[] = result.rows.map((row: any) => ({
      ...row,
      // Keep the date as-is from database to avoid timezone conversion issues
      date: row.date,
      created_at: new Date(row.created_at).toISOString(),
    }));

    console.log('Processed data:', data);

    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (e: any) {
    console.error('ETL Summary API Error:', e);
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
