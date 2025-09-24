import os
import json
import random
import asyncio
from dotenv import load_dotenv
from ..fmp_api import FMPAPI
from io import StringIO
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import PriceVolumeValidator, PriceVolumeFxValidator
from typing import Dict, List, Optional
from collections import defaultdict

# Get logger
logger = get_logger(__name__)

load_dotenv()

class HistoricalPriceVolumeManager:
    def __init__(self, start_date: str = "2013-12-01", max_symbols: int = 50000):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()
        self.start_date = start_date
        self.end_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        self.max_symbols = max_symbols

    async def create_price_volume_table(self):
        try:
            with self.engine.connect() as conn:
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS stage"))
                conn.commit()

                # Check if main table exists and clear data if it does
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'historical_price_volume'
                    )
                """)).scalar()
                
                if result:
                    logger.info("Historical price volume table exists, clearing all data...")
                    conn.execute(text("DELETE FROM raw.historical_price_volume"))
                    conn.commit()
                    logger.info("All data cleared from raw.historical_price_volume table")
                else:
                    logger.info("Creating historical price volume table in raw schema...")

                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS raw.historical_price_volume (
                        date DATE,
                        symbol VARCHAR(100),
                        currency VARCHAR(10),
                        close DECIMAL(20, 4),
                        volume NUMERIC(30, 4),
                        year INT,
                        quarter VARCHAR(2),
                        last_quarter_date BOOLEAN
                    )
                """))
                #,
                #PRIMARY KEY (date, symbol)
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS stage.historical_price_volume_stage (
                        date DATE,
                        symbol VARCHAR(100),
                        currency VARCHAR(10),
                        close DECIMAL(20, 4),
                        volume NUMERIC(30, 4),
                        year INT,
                        quarter VARCHAR(2),
                        last_quarter_date BOOLEAN
                    )
                """))

                conn.commit()
                logger.info("Tables created in raw and stage schemas.")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise

    def drop_indexes(self):
        with self.engine.connect() as conn:
            conn.execute(text("DROP INDEX IF EXISTS raw.idx_hpv_symbol_date_currency"))
            conn.commit()
            logger.info("Dropped indexes.")

    def create_indexes(self):
        with self.engine.connect() as conn:
            conn.execute(text("""
                              CREATE INDEX IF NOT EXISTS idx_hpv_symbol_date_currency
                              ON raw.historical_price_volume (symbol, date, currency);
                              """))    
            conn.commit()
            logger.info("Recreated indexes.")

    async def get_symbols_from_db(self):
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT symbol, currency 
                FROM raw.stock_info 
                WHERE relevant = TRUE
            """))
            return [(row[0], row[1]) for row in result]

    async def has_price_volume_data(self) -> bool:
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM raw.historical_price_volume")).scalar()
            return result > 0

    async def process_price_volume_batch(self, symbols_with_currency: list, start_date: str, end_date: str):
        try:
            symbols = [s[0] for s in symbols_with_currency]
            currency_map = {s[0]: s[1] for s in symbols_with_currency}
            tasks = [self.fmp.get_historical_price(symbol, start_date, end_date) for symbol in symbols]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            all_data = []
            for symbol, res in zip(symbols, results):
                if isinstance(res, Exception) or not res:
                    continue
                price_list = res if isinstance(res, list) else res.get("historical", [])
                # Normalize all dates
                for p in price_list:
                    raw_date = p.get("date")
                    if isinstance(raw_date, str):
                        p["date"] = datetime.strptime(raw_date, "%Y-%m-%d")
                    elif not isinstance(raw_date, datetime):
                        continue  # skip if invalid format

                # Compute max date per (year, quarter)
                max_date_by_quarter = defaultdict(lambda: None)
                for p in price_list:
                    date = p["date"]
                    year = date.year
                    quarter = ((date.month - 1) // 3) + 1
                    # Ensure the last month of the quarter is considered
                    if date.month % 3 == 0:
                        key = (year, quarter)
                        max_date_by_quarter[key] = (
                            max(max_date_by_quarter[key], date) if max_date_by_quarter[key] else date
                        )

                # Validate and tag each row
                today = datetime.today()
                current_year = today.year
                current_quarter = ((today.month - 1) // 3) + 1
                current_q_key = (current_year, current_quarter)

                for p in price_list:
                    try:
                        date = p["date"]
                        year = date.year
                        quarter = ((date.month - 1) // 3) + 1
                        key = (year, quarter)
                        is_last_quarter_date = (
                            False if key == current_q_key else date == max_date_by_quarter[key]
                        )
                        validated = PriceVolumeValidator(
                            date=p["date"],
                            symbol=symbol,
                            currency=currency_map.get(symbol),
                            close=p["close"],
                            volume=p["volume"],
                            year=year,
                            quarter=f"Q{quarter}",
                            last_quarter_date=is_last_quarter_date
                        )
                        all_data.append(validated.model_dump())
                    except Exception:
                         logger.error(f"Validation error for symbol {symbol} on {p.get('date')}: {e}")

            if not all_data:
                return

            buffer = StringIO()
            for record in all_data:
                try:
                    close = float(record['close']) if record['close'] else 0
                    volume = float(record['volume']) if record['volume'] else 0
                    if abs(close) >= 1e16: close = 0
                    if abs(volume) >= 1e24: volume = 0
                    buffer.write(f"{record['date']}\t{record['symbol']}\t{record['currency']}\t{close}\t{volume}\t{record['year']}\t{record['quarter']}\t{record['last_quarter_date']}\n")
                except Exception:
                    continue
            buffer.seek(0)

            conn = get_postgres_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute("SET search_path TO stage")
                    cur.copy_from(buffer, "historical_price_volume_stage", columns=("date", "symbol", "currency", "close", "volume", "year", "quarter", "last_quarter_date"))

                    cur.execute("""
                        INSERT INTO raw.historical_price_volume (date, symbol, currency, close, volume, year, quarter, last_quarter_date)
                        SELECT date, symbol, currency, close, volume, year, quarter, last_quarter_date
                        FROM stage.historical_price_volume_stage
                    """)
                        # ON CONFLICT (date, symbol) DO UPDATE
                        # SET close = EXCLUDED.close,
                        # volume = EXCLUDED.volume,
                        # currency = EXCLUDED.currency

                    cur.execute("TRUNCATE stage.historical_price_volume_stage")
                    conn.commit()
            finally:
                conn.close()

        except Exception as e:
            logger.error(f"Error in process_price_volume_batch: {e}", exc_info=True)

    def get_missing_symbols(self, symbols_with_currency):
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT DISTINCT symbol, currency 
                FROM raw.historical_price_volume
                WHERE date >= :start_date AND date <= :end_date
            """), {"start_date": self.start_date, "end_date": self.end_date})
            present = set((r[0], r[1]) for r in result)
        return [s for s in symbols_with_currency if s not in present]

    async def save_historical_price_volume(self):
        print("\n")
        logger.info(f"######################### Step 7 - HistoricalPriceVolumeManager initialized with start_date={self.start_date}, end_date={self.end_date}")

        await self.create_price_volume_table()
        if await self.has_price_volume_data():
            logger.warning("Data already exists. Aborting.")
            return False

        symbols_with_currency = await self.get_symbols_from_db()
        if not symbols_with_currency:
            logger.error("No symbols found.")
            return False

        symbols_to_process = random.sample(symbols_with_currency, min(self.max_symbols, len(symbols_with_currency)))
        logger.info(f"Selected {len(symbols_to_process)} symbols.")
        self.drop_indexes()

        batch_size = 250
        total_reps = 750 / batch_size
        time_per_rep = 60 / total_reps

        max_retries = 7
        attempt = 1
        while attempt <= max_retries and symbols_to_process:
            logger.info(f"Download attempt {attempt} for {len(symbols_to_process)} symbols")
            total_batches = (len(symbols_to_process) + batch_size - 1) // batch_size

            for i in range(0, len(symbols_to_process), batch_size):
                batch = symbols_to_process[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1}/{total_batches} (attempt {attempt})")

                start_time = datetime.now().timestamp()
                await self.process_price_volume_batch(batch, self.start_date, self.end_date)
                end_time = datetime.now().timestamp()
                duration = end_time - start_time

                logger.info(f"Batch {i//batch_size + 1} took {duration:.2f}s")

                if i + batch_size < len(symbols_to_process) and duration < time_per_rep:
                    sleep_time = 7 + time_per_rep - duration
                    logger.info(f"Sleeping for {sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)

            missing = self.get_missing_symbols(symbols_to_process)
            if not missing:
                logger.info("All symbols processed successfully.")
                break

            logger.warning(f"{len(missing)} symbols missing after attempt {attempt}. Retrying...")
            symbols_to_process = missing
            attempt += 1

        if symbols_to_process:
            logger.error(f"Failed to download {len(symbols_to_process)} symbols after {max_retries} attempts.")
        self.create_indexes()
        logger.info("Historical price volume ingestion complete.")
        return True



###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################
###########################################################################################################



class HistoricalPriceVolumeFxConverter:
    def __init__(self):
        """Initialize the HistoricalPriceVolumeFxConverter with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

    # def drop_indexes(self):
    #     """Drop non-essential indexes before conversion."""
    #     with self.engine.connect() as conn:
    #         logger.info("Dropping indexes before conversion...")
    #         conn.execute(text("DROP INDEX IF EXISTS idx_historical_price_volume_symbol"))
    #         conn.execute(text("DROP INDEX IF EXISTS idx_historical_price_volume_symbol_date_desc"))
    #         conn.commit()
    #         logger.info("Indexes dropped.")

    # def create_indexes(self):
    #     """Recreate non-essential indexes after conversion."""
    #     with self.engine.connect() as conn:
    #         logger.info("Recreating indexes after conversion...")
    #         conn.execute(text("""
    #                 CREATE INDEX IF NOT EXISTS idx_historical_price_volume_symbol
    #                 ON raw.historical_price_volume (symbol);
    #                 """))    
    #         conn.execute(text("""
    #                 CREATE INDEX IF NOT EXISTS idx_historical_price_volume_symbol_date_currency
    #                 ON raw.historical_price_volume (symbol, date, currency);
    #                 """))
    #         conn.commit()
    #         logger.info("Indexes recreated.")

    def _get_fx_conversion_sql(self):
        """Get the SQL query for FX conversion."""
        return text("""
        WITH forex_eur AS (
            SELECT *
            FROM clean.historical_forex_full 
            WHERE ccy_left = 'EUR'
        ),
        forex_usd AS (
            SELECT *
            FROM clean.historical_forex_full 
            WHERE ccy_left = 'USD'
        ),
        price_vol_eur_merge AS (
            SELECT 
                hpv.symbol,
                hpv.date,
                hpv.currency,
                hpv.close,
                hpv.volume,
                CASE 
                    WHEN hpv.close = 0 OR hpv.close is NULL OR hpv.volume = 0 OR hpv.volume is NULL OR fe.price IS NULL OR fe.price < 1e-6 THEN 0
                    ELSE ROUND((hpv.close / NULLIF(fe.price, 0))::numeric, 4)
                END AS close_eur,
                CASE 
                    WHEN hpv.close = 0 OR hpv.close is NULL OR hpv.volume = 0 OR hpv.volume is NULL OR fe.price IS NULL OR fe.price < 1e-6 THEN 0
                    ELSE ROUND((hpv.volume / NULLIF(fe.price, 0))::numeric, 0)
                END AS volume_eur
            FROM raw.historical_price_volume hpv 
            LEFT JOIN forex_eur fe
            ON hpv.date = fe.date AND hpv.currency = fe.ccy_right
            WHERE hpv.date >= :d_start AND hpv.date < :d_next
        ),
        price_vol_eur_usd_merge AS (
            SELECT 
                pve.symbol,
                pve.date,
                pve.currency,
                pve.close_eur,
                pve.volume_eur,
                CASE 
                    WHEN pve.close_eur = 0 OR pve.close is NULL OR pve.volume = 0 OR pve.volume is NULL OR fu.price IS NULL OR fu.price < 1e-6 THEN 0
                    ELSE ROUND((pve.close / fu.price)::numeric, 4)
                END AS close_usd,
                CASE 
                    WHEN pve.close_eur = 0 OR pve.close is NULL OR pve.volume = 0 OR pve.volume is NULL OR fu.price IS NULL OR fu.price < 1e-6 THEN 0
                    ELSE ROUND((pve.volume /fu.price)::numeric, 0)
                END AS volume_usd
            FROM price_vol_eur_merge pve
            LEFT JOIN forex_usd fu
            ON pve.date = fu.date AND pve.currency = fu.ccy_right
            WHERE pve.date >= :d_start AND pve.date < :d_next
        )
        UPDATE raw.historical_price_volume hpv
        SET 
            close_eur = merged.close_eur,
            volume_eur = merged.volume_eur,
            close_usd = merged.close_usd,
            volume_usd = merged.volume_usd,
            created_at = NOW()
        FROM price_vol_eur_usd_merge merged
        WHERE 
            hpv.symbol = merged.symbol AND
            hpv.date = merged.date AND
            hpv.currency = merged.currency;
                """)

    async def run_conversion(self):
        """Run the currency conversion process using a batched SQL update (by month), logging progress in Python."""

        print("\n")
        logger.info("######################### Step 8 - HistoricalPriceVolumeFxConverter initialized")

        try:
            logger.info("Starting historical price volume currency conversion (batched SQL-based, Python loop)...")
            with self.engine.connect() as conn:
                # Add columns if they do not exist
                conn.execute(text("""
                    ALTER TABLE raw.historical_price_volume
                    ADD COLUMN IF NOT EXISTS close_eur NUMERIC(20, 4),
                    ADD COLUMN IF NOT EXISTS volume_eur NUMERIC,
                    ADD COLUMN IF NOT EXISTS close_usd NUMERIC(20, 4),
                    ADD COLUMN IF NOT EXISTS volume_usd NUMERIC,
                    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
                """))
                conn.commit()

            # Drop secondary index before conversion
            #self.drop_indexes()

            d_start = datetime(2013, 12, 1).date()
            d_end = datetime.now().date()
            from dateutil.relativedelta import relativedelta
            batch_size = relativedelta(months=1)

            batch_num = 1
            while d_start < d_end:
                d_next = d_start + batch_size
                sql = self._get_fx_conversion_sql()
                with self.engine.connect() as conn:
                    conn.execute(sql, {"d_start": d_start, "d_next": d_next})
                    conn.commit()
                    logger.info(f"Completed batch {batch_num}: {d_start} to {d_next}")
                d_start = d_next
                batch_num += 1

            # Recreate secondary index after conversion
            #self.create_indexes()
            logger.info("Historical price volume currency conversion completed successfully (batched SQL-based, Python loop)")
            return True
        except Exception as e:
            logger.error(f"Error in currency conversion: {str(e)}")
            raise 

if __name__ == "__main__":
    price_manager = HistoricalPriceVolumeManager() # Then, get and store historical prices
    asyncio.run(price_manager.save_historical_price_volume())

    fx_converter = HistoricalPriceVolumeFxConverter() #Convert prices to EUR and USD
    asyncio.run(fx_converter.run_conversion())