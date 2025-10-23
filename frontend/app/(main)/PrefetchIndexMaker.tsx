'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrefetchIndexMaker() {
  const router = useRouter();
  useEffect(() => {
    const prefetch = () => {
      try {
        router.prefetch('/index-maker');
        if (process.env.NODE_ENV !== 'production') {
          // Aid verification in dev
          // eslint-disable-next-line no-console
          console.log('[prefetch] /index-maker queued');
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[prefetch] failed', e);
        }
      }

      // Additionally warm important data APIs so dev feels snappy too
      try {
        // Index fields used on Index Maker load
        fetch('/api/index-fields', { cache: 'no-store' })
          .then(() => { if (process.env.NODE_ENV !== 'production') console.log('[prefetch] /api/index-fields'); })
          .catch(() => {});
        // Optional: warm a small benchmark set (endpoint requires query params)
        const today = new Date().toISOString().split('T')[0];
        const benchUrl = `/api/benchmark-data?symbols=SPY&startDate=2019-01-01&endDate=${today}&startAmount=1000&currency=USD`;
        fetch(benchUrl, { cache: 'force-cache' })
          .then(() => { if (process.env.NODE_ENV !== 'production') console.log('[prefetch] benchmark-data (SPY)'); })
          .catch(() => {});

        // Warm all index fields (countries, sectors, industries, kpis, companies, benchmarks)
        fetch('/api/index-fields', { cache: 'force-cache' })
          .then(() => { if (process.env.NODE_ENV !== 'production') console.log('[prefetch] index-fields (countries/sectors/industries/kpis/companies/benchmarks)'); })
          .catch(() => {});
      } catch {}
    };
    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 500);
    }
  }, [router]);
  return null;
}


