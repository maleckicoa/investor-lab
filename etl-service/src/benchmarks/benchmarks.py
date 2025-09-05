import asyncio
import random
from typing import List, Dict
from datetime import datetime, date, timedelta

from ..fmp_api import FMPAPI
from ..utils.utils import get_postgres_connection, get_logger, ensure_schemas_exist


etf_symbols: Dict[str, Dict[str, str]] = {
    "SPY": {"name": "SPDR S&P 500 ETF Trust", "currency": "USD"},
    "SMH": {"name": "VanEck Semiconductor ETF", "currency": "USD"},
}


class BenchmarkManager:
    def __init__(self):
        self.api = FMPAPI()
        self.logger = get_logger("BenchmarkManager")

    async def fetch_benchmarks_catalog(self) -> List[Dict]:
        """Fetch only index symbols (exclude ETFs)."""
        indices = await self.api.get_index_list()
        items: List[Dict] = []
        for src in (indices or []):
            sym = src.get("symbol")
            name = src.get("name")
            # Currency could be exposed as 'currency' or 'priceCurrency' depending on API response
            currency = src.get("currency") or src.get("priceCurrency") or "USD"
            if sym and name:
                items.append({"symbol": sym, "name": name, "type": "index", "currency": currency})
        # Also include selected ETF symbols explicitly
        for sym, meta in etf_symbols.items():
            items.append({"symbol": sym, "name": meta["name"], "type": "etf", "currency": meta.get("currency", "USD")})
        return items

    async def fetch_history_for_symbol(self, symbol: str, start_date: str = "2014-01-01") -> List[Dict]:
        """Fetch historical price data for a single symbol."""
        from_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        to_date = (date.today() - timedelta(days=2)).isoformat()
        data = await self.api.get_historical_price(symbol, from_date.isoformat(), to_date)
        # Expect list of dicts with date and close
        if isinstance(data, dict) and "historical" in data:
            return data["historical"]
        if isinstance(data, list):
            return data
        return []

    def _create_table_if_needed(self):
        ensure_schemas_exist()
        conn = get_postgres_connection()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS raw.benchmarks (
                symbol TEXT NOT NULL,
                name   TEXT,
                type   TEXT,
                currency TEXT,
                date   DATE NOT NULL,
                close  DOUBLE PRECISION,
                PRIMARY KEY (symbol, date)
            )
            """
        )
        # Create a composite index to speed up queries by symbol/date/currency
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS benchmarks_date_currency_idx
            ON raw.benchmarks(date, currency)
            """
        )
        conn.commit()
        cur.close()
        conn.close()

    def _upsert_rows(self, rows: List[Dict]):
        if not rows:
            return
        conn = get_postgres_connection()
        cur = conn.cursor()
        args_str = ",".join(cur.mogrify("(%s,%s,%s,%s,%s,%s)", (
            r["symbol"], r.get("name"), r.get("type"), r.get("currency"), r["date"], r.get("close")
        )).decode("utf-8") for r in rows)
        cur.execute(
            f"""
            INSERT INTO raw.benchmarks(symbol, name, type, currency, date, close)
            VALUES {args_str}
            ON CONFLICT (symbol, date) DO UPDATE SET
              name = EXCLUDED.name,
              type = EXCLUDED.type,
              currency = EXCLUDED.currency,
              close = EXCLUDED.close
            """
        )
        conn.commit()
        cur.close()
        conn.close()

    def get_missing_symbols(self, symbols: List[str]) -> List[str]:
        """Get symbols that are missing from the database."""
        conn = get_postgres_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT symbol FROM raw.benchmarks")
        present = set(row[0] for row in cur.fetchall())
        cur.close()
        conn.close()
        return [s for s in symbols if s not in present]

    def _drop_table_if_exists(self):
        """Drop raw.benchmarks to start fresh each run."""
        ensure_schemas_exist()
        conn = get_postgres_connection()
        cur = conn.cursor()
        self.logger.info("Dropping raw.benchmarks table if it exists...")
        cur.execute("DROP TABLE IF EXISTS raw.benchmarks")
        conn.commit()
        cur.close()
        conn.close()

    async def process_single_symbol(self, item: Dict) -> List[Dict]:
        """Process a single symbol and return its historical data rows."""
        sym = item["symbol"]
        name = item.get("name")
        typ = item.get("type")
        currency = item.get("currency")
        try:
            hist = await self.fetch_history_for_symbol(sym)
            rows = []
            for h in hist:
                d = h.get("date") or h.get("formatted")
                c = h.get("close") or h.get("adjClose")
                if d:
                    rows.append({
                        "symbol": sym,
                        "name": name,
                        "type": typ,
                        "currency": currency,
                        "date": d,
                        "close": c
                    })
            self.logger.info(f"Fetched {len(rows)} rows for {sym}")
            return rows
        except Exception as e:
            self.logger.error(f"Failed for {sym}: {e}")
            return []

    async def process_batch(self, batch: List[Dict]):
        """Process a batch of symbols concurrently and fetch their historical data."""
        # Process all symbols in the batch concurrently
        tasks = [self.process_single_symbol(item) for item in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect all rows from successful fetches
        all_rows = []
        for result in results:
            if isinstance(result, list):
                all_rows.extend(result)
            elif isinstance(result, Exception):
                self.logger.error(f"Task failed with exception: {result}")
        
        # Upsert all rows at once
        if all_rows:
            self._upsert_rows(all_rows)
            self.logger.info(f"Upserted {len(all_rows)} total rows for batch of {len(batch)} symbols")

    async def run(self, max_symbols: int = 500):
        """Main execution method with retry logic and batching."""
        
        print("\n")
        self.logger.info(f"######################### Step 7 (14) - BenchmarkManager initialized")

        self._drop_table_if_exists()
        self._create_table_if_needed()
        catalog = await self.fetch_benchmarks_catalog()
        self.logger.info(f"Fetched {len(catalog)} benchmark symbols")

        # Limit to avoid huge loads initially
        catalog = catalog[:max_symbols]
        symbols_to_process = [item["symbol"] for item in catalog]

        batch_size = 250
        total_reps = 750 / batch_size
        time_per_rep = 60 / total_reps

        max_retries = 7
        attempt = 1

        while attempt <= max_retries and symbols_to_process:
            self.logger.info(f"Download attempt {attempt} for {len(symbols_to_process)} symbols")
            total_batches = (len(symbols_to_process) + batch_size - 1) // batch_size

            for i in range(0, len(symbols_to_process), batch_size):
                batch_symbols = symbols_to_process[i:i + batch_size]
                batch_items = [item for item in catalog if item["symbol"] in batch_symbols]
                
                self.logger.info(f"Processing batch {i//batch_size + 1}/{total_batches} (attempt {attempt})")

                start_time = datetime.now().timestamp()
                await self.process_batch(batch_items)
                end_time = datetime.now().timestamp()
                duration = end_time - start_time

                self.logger.info(f"Batch {i//batch_size + 1} took {duration:.2f}s")

                # After each batch, recompute remaining symbols based on DB presence
                missing_after_batch = self.get_missing_symbols(symbols_to_process)
                symbols_to_process = missing_after_batch
                self.logger.info(f"Remaining symbols_to_process after batch: {len(symbols_to_process)}")

                # If nothing remains, finish early
                if not symbols_to_process:
                    self.logger.info("All symbols processed successfully (early completion).")
                    return

                # Sleep between batches (except for the last batch)
                if i + batch_size < len(symbols_to_process) and duration < time_per_rep:
                    sleep_time = 7 + time_per_rep - duration
                    self.logger.info(f"Sleeping for {sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)

            # Check for missing symbols and retry if needed
            missing = self.get_missing_symbols(symbols_to_process)
            if not missing:
                self.logger.info("All symbols processed successfully.")
                break

            self.logger.warning(f"{len(missing)} symbols missing after attempt {attempt}. Retrying...")
            symbols_to_process = missing
            attempt += 1

        if symbols_to_process:
            self.logger.error(f"Failed to download {len(symbols_to_process)} symbols after {max_retries} attempts.")



class BenchmarkFxConverter:
    def __init__(self):
        self.logger = get_logger("BenchmarkFxConverter")

    def _add_columns_if_missing(self):
        conn = get_postgres_connection()
        cur = conn.cursor()
        # Add columns if they do not exist
        cur.execute(
            """
            ALTER TABLE raw.benchmarks
            ADD COLUMN IF NOT EXISTS close_eur DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS close_usd DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """
        )
        conn.commit()
        cur.close()
        conn.close()

    def convert(self):
        print("\n")
        self.logger.info(f"######################### Step 8 (15) - BenchmarkFxConverter initialized")

        self._add_columns_if_missing()
        conn = get_postgres_connection()
        cur = conn.cursor()

        # Use clean.historical_forex_full to map by date and currency on the right leg
        # For EUR conversion use rows where ccy_left = 'EUR' and ccy_right = benchmarks.currency
        # For USD conversion use rows where ccy_left = 'USD' and ccy_right = benchmarks.currency
        # If the benchmark currency already equals EUR/USD, we keep the same close
        sql_update = """
            WITH forex_rates AS (
                SELECT 
                    date,
                    TRIM(UPPER(ccy_right)) AS currency,
                    MAX(CASE WHEN ccy_left = 'EUR' THEN price END) AS eur_rate,
                    MAX(CASE WHEN ccy_left = 'USD' THEN price END) AS usd_rate
                FROM clean.historical_forex_full
                WHERE ccy_left IN ('EUR', 'USD')
                GROUP BY date, ccy_right
            )

            UPDATE raw.benchmarks AS b
            SET
                close_eur = ROUND(CAST(CASE
                    WHEN TRIM(UPPER(b.currency)) = 'EUR' THEN b.close
                    ELSE b.close / f.eur_rate
                END AS NUMERIC), 4),
                close_usd = ROUND(CAST(CASE
                    WHEN TRIM(UPPER(b.currency)) = 'USD' THEN b.close
                    ELSE b.close / f.usd_rate
                END AS NUMERIC), 4),
                created_at = COALESCE(b.created_at, CURRENT_TIMESTAMP)
            FROM forex_rates f
            WHERE 
                f.date = b.date AND 
                f.currency = TRIM(UPPER(b.currency));

        """
        cur.execute(sql_update)
        self.logger.info("Benchmark FX conversion completed (close_eur, close_usd, created_at populated).")
        conn.commit()
        cur.close()
        conn.close()

async def main():
    mgr = BenchmarkManager()
    await mgr.run()

    fx = BenchmarkFxConverter()
    fx.convert()

if __name__ == "__main__":
    asyncio.run(main())
