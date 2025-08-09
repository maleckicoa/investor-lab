import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ETLSummary } from '@/types/etl';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          date,
          day,
          fx_cnt,
          close_cnt,
          vol_cnt,
          close_eur_cnt,
          close_usd_cnt,
          vol_eur_cnt,
          vol_usd_cnt,
          mcap_cnt,
          mcap_eur_cnt,
          mcap_usd_cnt,
          created_at
        FROM raw.etl_summary 
        ORDER BY date DESC 
        LIMIT 30
      `);
      
      const data: ETLSummary[] = result.rows.map(row => ({
        ...row,
        date: row.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        created_at: row.created_at.toISOString()
      }));
      
      return NextResponse.json({ data });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETL summary data' },
      { status: 500 }
    );
  }
} 