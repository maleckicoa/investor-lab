import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ETLSummary } from '@/types/etl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
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
      LIMIT 30
    `);

    const data: ETLSummary[] = result.rows.map((row: any) => ({
      ...row,
      date: new Date(row.date).toISOString().split('T')[0],
      created_at: new Date(row.created_at).toISOString(),
    }));

    return NextResponse.json(
      { data },
      {
        headers: {
          // prevent browser/proxy caching
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}

