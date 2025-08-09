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
from ..utils.models import MarketCapValidator, McapFxValidator
from typing import Dict, List, Optional

# Get logger
logger = get_logger(__name__)

load_dotenv()

class HistoricalMcapManager:
    def __init__(self, start_date: str = "2014-01-01"):
        """Initialize the HistoricalMcapManager with database connection and configuration parameters."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()
        self.start_date = start_date
        self.end_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
    async def create_market_cap_table(self):
        """Create the historical_market_cap table and staging table if they don't exist."""
        try:
            with self.engine.connect() as conn:
                logger.info("Creating raw and stage schemas if they don't exist...")
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS stage"))
                conn.commit()

                # Check if main table exists and clear data if it does
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'historical_market_cap'
                    )
                """)).scalar()
                
                if result:
                    logger.info("Historical market cap table exists, clearing all data...")
                    conn.execute(text("DELETE FROM raw.historical_market_cap"))
                    conn.commit()
                    logger.info("All data cleared from raw.historical_market_cap table")
                else:
                    logger.info("Creating historical market cap table in raw schema...")

                # Create main table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS raw.historical_market_cap (
                        date DATE,
                        symbol VARCHAR(100),
                        currency VARCHAR(10),
                        market_cap NUMERIC(30, 0)
                    )
                """))
                #,
                #PRIMARY KEY (date, symbol)
                # Create staging table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS stage.historical_market_cap_stage (
                        date DATE,
                        symbol VARCHAR(100),
                        currency VARCHAR(10),
                        market_cap NUMERIC(30, 0)
                    )
                """))
                conn.commit()
                logger.info("Tables created in raw and stage schemas.")
        except Exception as e:
            logger.error(f"Error creating tables: {str(e)}")
            raise

    def drop_indexes(self):

        with self.engine.connect() as conn:
            logger.info("Dropping indexes...")
            conn.execute(text("DROP INDEX IF EXISTS idx_historical_market_cap_symbol"))
            conn.execute(text("DROP INDEX IF EXISTS idx_historical_market_cap_symbol_date_desc"))
            conn.commit()
            logger.info("Indexes dropped.")

    def create_indexes(self):
  
        with self.engine.connect() as conn:
            logger.info("Recreating indexes...")
            
            conn.execute(text("""
                              CREATE INDEX IF NOT EXISTS idx_historical_market_cap_symbol
                              ON raw.historical_market_cap (symbol)
                              """))

            conn.execute(text("""
                              CREATE INDEX IF NOT EXISTS idx_historical_market_cap_symbol_date_desc
                              ON raw.historical_market_cap (symbol, date DESC);
                              """))
            conn.commit()
            logger.info("Indexes recreated.")



    async def get_symbols_from_db(self):
        """Get all unique symbols and their currencies from the historical_price_volume table."""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT DISTINCT symbol, currency FROM raw.historical_price_volume"))
            symbols_with_currency = [(row[0], row[1]) for row in result]
            logger.info(f"Retrieved {len(symbols_with_currency)} unique symbols from historical_price_volume table")
            return symbols_with_currency

    async def has_market_cap_data(self) -> bool:
        """Check if the historical_market_cap table has any data."""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM raw.historical_market_cap")).scalar()
            has_data = result > 0
            if has_data:
                logger.info(f"Found {result} existing records in historical_market_cap table")
            else:
                logger.info("No existing records found in historical_market_cap table")
            return has_data

    async def process_market_cap_batch(self, symbols_with_currency: list, start_date: str, end_date: str):
        try:
            symbols = [s[0] for s in symbols_with_currency]
            currency_map = {s[0]: s[1] for s in symbols_with_currency}
            tasks = [self.fmp.get_historical_mcap(symbol, start_date, end_date) for symbol in symbols]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            all_mcap_data = []
            for symbol, result in zip(symbols, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Error fetching data for {symbol}: {str(result)}")
                    continue
                if not result:
                    logger.warning(f"Empty response for {symbol}")
                    continue
                if isinstance(result, list):
                    mcap_data_list = result
                else:
                    logger.warning(f"Unexpected response format for {symbol}. Response type: {type(result)}")
                    continue
                if not mcap_data_list:
                    logger.warning(f"No historical market cap data found for {symbol}")
                    continue
                for mcap_data in mcap_data_list:
                    try:
                        date_value = mcap_data.get('date')
                        if isinstance(date_value, str):
                            date_value = datetime.strptime(date_value, '%Y-%m-%d')
                        market_cap = mcap_data.get('marketCap')
                        if market_cap is None:
                            logger.warning(f"Missing marketCap for {symbol} on {date_value}")
                            continue
                        try:
                            market_cap_val = float(market_cap)
                            if abs(market_cap_val) >= 1e24:
                                logger.error(f"Numeric field overflow (market_cap): symbol={symbol}, date={date_value}, market_cap={market_cap}. Setting market_cap=0.")
                                market_cap_val = 0
                        except Exception as e:
                            logger.error(f"Error validating market_cap for symbol={symbol}, date={date_value}: {e}. Setting market_cap=0.")
                            market_cap_val = 0
                        validated_record = MarketCapValidator(
                            date=date_value,
                            symbol=symbol,
                            currency=currency_map.get(symbol),
                            market_cap=int(market_cap_val)
                        )
                        all_mcap_data.append(validated_record.model_dump())
                    except Exception as e:
                        logger.warning(f"Validation failed for {symbol} on {mcap_data.get('date')}: {e}")
                        continue
            if all_mcap_data:
                buffer = StringIO()
                for record in all_mcap_data:
                    try:
                        market_cap_val = float(record['market_cap']) if record['market_cap'] is not None else 0
                        if abs(market_cap_val) >= 1e24:
                            logger.error(f"Numeric field overflow (market_cap): symbol={record['symbol']}, date={record['date']}, market_cap={record['market_cap']}. Setting market_cap=0.")
                            record['market_cap'] = 0
                        buffer.write(f"{record['date'].date()}\t{record['symbol']}\t{record['currency']}\t{record['market_cap']}\n")
                    except Exception as e:
                        logger.error(f"Error validating market_cap value for symbol={record['symbol']}, date={record['date']}: {e}")
                        continue
                buffer.seek(0)
                conn = get_postgres_connection()
                try:
                    with conn.cursor() as cur:
                        cur.execute("SET search_path TO stage")
                        cur.copy_from(buffer, 'historical_market_cap_stage', columns=('date', 'symbol', 'currency', 'market_cap'))
                        cur.execute("""
                            INSERT INTO raw.historical_market_cap (date, symbol, currency, market_cap)
                            SELECT date, symbol, currency, market_cap
                            FROM stage.historical_market_cap_stage
                        """)
                        cur.execute("TRUNCATE stage.historical_market_cap_stage")
                        conn.commit()
                        logger.info(f"Successfully stored {len(all_mcap_data)} historical market cap records for batch of {len(symbols)} symbols")
                finally:
                    conn.close()
        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            logger.exception("Full traceback:")

    def get_missing_symbols(self, symbols_with_currency):
        """Return a list of (symbol, currency) tuples missing from the historical_market_cap table for the date range."""
        with self.engine.connect() as conn:
            result = conn.execute(text(f'''
                SELECT DISTINCT symbol, currency
                FROM raw.historical_market_cap
                WHERE date >= :start_date AND date <= :end_date
            '''), {"start_date": self.start_date, "end_date": self.end_date})
            present = set((row[0], row[1]) for row in result)
        return [s for s in symbols_with_currency if s not in present]
    
    async def save_historical_market_cap(self):

        print("\n")
        logger.info(f"######################### Step 9 - HistoricalMcapManager initialized with start_date={self.start_date}, end_date={self.end_date}")


        await self.create_market_cap_table()
        if await self.has_market_cap_data():
            logger.warning("Historical market cap table already contains data. Aborting save operation.")
            return False
        symbols_with_currency = await self.get_symbols_from_db()
        if not symbols_with_currency:
            logger.error("No symbols found in database. Please run stock_symbols.py first.")
            return False
        symbols_to_process = symbols_with_currency.copy()
        logger.info(f"Selected {len(symbols_to_process)} random symbols for processing")
        logger.info(f"Fetching historical market cap data from {self.start_date} to {self.end_date}")
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
                batch_start_time = datetime.now().timestamp()
                batch = symbols_to_process[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1} of {total_batches} ({len(batch)} symbols) (attempt {attempt})")
                await self.process_market_cap_batch(batch, self.start_date, self.end_date)
                logger.info(f"Completed batch {i//batch_size + 1} of {total_batches} (attempt {attempt})")
                batch_end_time = datetime.now().timestamp()
                batch_duration = batch_end_time - batch_start_time
                logger.info(f"Batch {i//batch_size + 1} took {batch_duration:.2f} seconds to complete")
                if i + batch_size < len(symbols_to_process) and batch_duration < time_per_rep:
                    sleep_time = 7 + time_per_rep - batch_duration
                    logger.info(f"Sleeping for {sleep_time:.2f} seconds")
                    await asyncio.sleep(sleep_time)
            missing = self.get_missing_symbols(symbols_to_process)
            if not missing:
                logger.info("All symbols successfully downloaded.")
                symbols_to_process = []
                break
            logger.warning(f"{len(missing)} symbols missing after attempt {attempt}. Will retry.")
            symbols_to_process = missing
            attempt += 1
        if symbols_to_process:
            logger.error(f"Failed to download data for {len(symbols_to_process)} symbols after {max_retries} attempts.")
        self.create_indexes()
        logger.info("Historical market cap data collection completed")
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
###########################################################################################################

class HistoricalMcapFxConverter:
    def __init__(self):
        """Initialize the HistoricalMcapFxConverter with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

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
mcap_eur_merge AS (
    SELECT 
        hmc.symbol,
        hmc.date,
        hmc.currency,
        hmc.market_cap,
        CASE 
            WHEN hmc.market_cap = 0 OR hmc.market_cap IS NULL OR fe.price IS NULL OR fe.price < 1e-6 THEN 0
            ELSE ROUND((hmc.market_cap / fe.price)::numeric, 0)
        END AS market_cap_eur
    FROM raw.historical_market_cap hmc
    LEFT JOIN forex_eur fe
      ON hmc.date = fe.date AND hmc.currency = fe.ccy_right
    WHERE hmc.date >= :d_start AND hmc.date < :d_next
),
mcap_eur_usd_merge AS (
    SELECT 
        mem.symbol,
        mem.date,
        mem.currency,
        mem.market_cap_eur,
        CASE 
            WHEN mem.market_cap = 0 OR mem.market_cap IS NULL OR fu.price IS NULL OR fu.price < 1e-6 THEN 0
            ELSE ROUND((mem.market_cap / fu.price)::numeric, 0)
        END AS market_cap_usd
    FROM mcap_eur_merge mem
    LEFT JOIN forex_usd fu
      ON mem.date = fu.date AND mem.currency = fu.ccy_right
    WHERE mem.date >= :d_start AND mem.date < :d_next
)
UPDATE raw.historical_market_cap hmc
SET 
    market_cap_eur = merged.market_cap_eur,
    market_cap_usd = merged.market_cap_usd,
    created_at = NOW()
FROM mcap_eur_usd_merge merged
WHERE 
    hmc.symbol = merged.symbol AND
    hmc.date = merged.date AND
    hmc.currency = merged.currency;
        """)

    def drop_indexes(self):
        """Drop non-essential indexes before conversion."""
        with self.engine.connect() as conn:
            logger.info("Dropping indexes...")
            conn.execute(text("DROP INDEX IF EXISTS idx_historical_market_cap_symbol"))
            conn.execute(text("DROP INDEX IF EXISTS idx_historical_market_cap_symbol_date_desc"))
            conn.commit()
            logger.info("Indexes dropped.")

    def create_indexes(self):
        """Recreate non-essential indexes after conversion."""
        with self.engine.connect() as conn:
            logger.info("Recreating indexes...")
            conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_historical_market_cap_symbol
                    ON raw.historical_market_cap (symbol)
                    """))

            conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_historical_market_cap_symbol_date_desc
                    ON raw.historical_market_cap (symbol, date DESC);
                    """))
            conn.commit()
            logger.info("Indexes recreated.")

    async def run_conversion(self):
        """Run the market cap currency conversion process using a batched SQL update (by month), logging progress in Python."""

        print("\n")
        logger.info("######################### Step 10 - HistoricalMcapFxConverter initialized")

        try:
            logger.info("Starting historical market cap currency conversion (batched SQL-based, Python loop)...")
            with self.engine.connect() as conn:
                # Add columns if they do not exist
                conn.execute(text("""
                    ALTER TABLE raw.historical_market_cap
                    ADD COLUMN IF NOT EXISTS market_cap_eur NUMERIC(30, 0),
                    ADD COLUMN IF NOT EXISTS market_cap_usd NUMERIC(30, 0),
                    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
                """))
                conn.commit()

            # Drop secondary index before conversion
            self.drop_indexes()

            d_start = datetime(2014, 1, 1).date()
            d_end = datetime.now().date()
            from dateutil.relativedelta import relativedelta
            batch_size = relativedelta(months=1)

            batch_num = 1
            while d_start < d_end:
                d_next = d_start + batch_size
                sql = text("""
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
                mcap_eur_merge AS (
                    SELECT 
                        hmc.symbol,
                        hmc.date,
                        hmc.currency,
                        hmc.market_cap,
                        CASE 
                            WHEN hmc.market_cap = 0 OR hmc.market_cap IS NULL OR fe.price IS NULL OR fe.price < 1e-6 THEN 0
                            ELSE ROUND((hmc.market_cap / fe.price)::numeric, 0)
                        END AS market_cap_eur
                    FROM raw.historical_market_cap hmc
                    LEFT JOIN forex_eur fe
                    ON hmc.date = fe.date AND hmc.currency = fe.ccy_right
                    WHERE hmc.date >= :d_start AND hmc.date < :d_next
                ),
                mcap_eur_usd_merge AS (
                    SELECT 
                        mem.symbol,
                        mem.date,
                        mem.currency,
                        mem.market_cap_eur,
                        CASE 
                            WHEN mem.market_cap = 0 OR mem.market_cap IS NULL OR fu.price IS NULL OR fu.price < 1e-6 THEN 0
                            ELSE ROUND((mem.market_cap / fu.price)::numeric, 0)
                        END AS market_cap_usd
                    FROM mcap_eur_merge mem
                    LEFT JOIN forex_usd fu
                    ON mem.date = fu.date AND mem.currency = fu.ccy_right
                    WHERE mem.date >= :d_start AND mem.date < :d_next
                )
                UPDATE raw.historical_market_cap hmc
                SET 
                    market_cap_eur = merged.market_cap_eur,
                    market_cap_usd = merged.market_cap_usd,
                    created_at = NOW()
                FROM mcap_eur_usd_merge merged
                WHERE 
                    hmc.symbol = merged.symbol AND
                    hmc.date = merged.date AND
                    hmc.currency = merged.currency;
                                """)
                with self.engine.connect() as conn:
                    conn.execute(sql, {"d_start": d_start, "d_next": d_next})
                    conn.commit()
                    logger.info(f"Completed batch {batch_num}: {d_start} to {d_next}")
                d_start = d_next
                batch_num += 1

            # Recreate secondary index after conversion
            self.create_indexes()

            logger.info("Historical market cap currency conversion completed successfully (batched SQL-based, Python loop)")
            return True
        except Exception as e:
            logger.error(f"Error in currency conversion: {str(e)}")
            raise 




if __name__ == "__main__":
    mcap_manager = HistoricalMcapManager() # Get and store historical market cap data
    asyncio.run(mcap_manager.save_historical_market_cap())

    mcap_fx_converter = HistoricalMcapFxConverter()  # Convert market cap to EUR and USD
    asyncio.run(mcap_fx_converter.run_conversion())