import asyncio
from ..fmp_api import FMPAPI
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import random
from io import StringIO
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import ForexRawValidator

# Get logger
logger = get_logger(__name__)

# Load environment variables
load_dotenv()

class HistoricalForexManager:
    def __init__(self, start_date: str = "2013-12-01"):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()
        self.start_date = start_date
        self.end_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

    async def get_forex_pairs(self):
        """Get all available forex currency pairs."""
        try:
            pairs = await self.fmp.get_forex_pairs()
            
            # Filter and sort pairs - EUR first, then USD
            eur_pairs = [pair for pair in pairs if pair.get('symbol', '').startswith('EUR')]
            usd_pairs = [pair for pair in pairs if pair.get('symbol', '').startswith('USD')]
            
            logger.info(f"Found {len(eur_pairs)} EUR pairs and {len(usd_pairs)} USD pairs")
            
            
            return eur_pairs + usd_pairs
        except Exception as e:
            logger.error(f"Error fetching forex pairs: {str(e)}")
            raise

    async def create_forex_table(self):
        """Create the historical_forex table if it doesn't exist."""
        try:
            with self.engine.connect() as conn:
                logger.info("Creating raw schema if it doesn't exist...")
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.commit()
                
                # Check if table exists first
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'historical_forex'
                    )
                """)).scalar()
                
                if result:
                    logger.info("Historical forex table exists, clearing all data...")
                    conn.execute(text("DROP TABLE IF EXISTS raw.historical_forex"))
                    conn.commit()
                    logger.info("All data cleared from raw.historical_forex table")
                else:
                    logger.info("Creating historical forex table in raw schema...")
                
                # Create historical_forex table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS raw.historical_forex (
                        date DATE,
                        forex_pair VARCHAR(20),
                        price DECIMAL(20, 6),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (date, forex_pair)
                    )
                """))
                conn.commit()
                
                # Verify table exists
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'historical_forex'
                    )
                """)).scalar()
                
                if result:
                    logger.info("Successfully verified historical forex table in raw schema")
                else:
                    logger.error("Failed to create historical forex table in raw schema")
                    raise Exception("Table creation failed")
                
        except Exception as e:
            logger.error(f"Error creating forex table: {str(e)}")
            raise

    async def has_forex_data(self) -> bool:
        """Check if the historical_forex table has any data."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM raw.historical_forex")).scalar()
                has_data = result > 0
                if has_data:
                    logger.info(f"Found {result} existing records in historical_forex table")
                else:
                    logger.info("No existing records found in historical_forex table")
                return has_data
        except Exception as e:
            logger.error(f"Error checking forex data: {str(e)}")
            raise



    async def process_forex_batch(self, pairs: list):
        """Process a batch of forex pairs and store their historical data."""
        try:
            # Process each pair in the batch concurrently
            tasks = []
            for pair in pairs:
                symbol = pair.get('symbol')
                logger.info(f"Fetching historical data for forex pair: {symbol}")
                tasks.append(self.fmp.get_historical_forex(symbol, self.start_date, self.end_date))
            
            # Wait for all API calls to complete
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            
            # Process results and prepare data for bulk insert
            all_forex_data = []
            for pair, result in zip(pairs, batch_results):
                symbol = pair.get('symbol')

                #print(symbol, result[0])
                

                
                if isinstance(result, Exception):
                    logger.error(f"Error fetching data for {symbol}: {str(result)}")
                    continue
                
                if not result:
                    logger.warning(f"No historical data found for {symbol}")
                    continue

                # Process each historical record
                for record in result:
                    try:
                        # Convert date string to datetime if needed
                        if isinstance(record.get('date'), str):
                            record['date'] = datetime.strptime(record.get('date'), '%Y-%m-%d')
                        
                        # Validate the record
                        validated_record = ForexRawValidator(
                            date=record.get('date'),
                            forex_pair=symbol,
                            price=float(record.get('price', 0))
                        )
                        all_forex_data.append(validated_record.model_dump())
                    except Exception as e:
                        logger.warning(f"Validation failed for {symbol} on {record.get('date')}: {e}")
                        continue

            # Bulk insert all validated data
            if all_forex_data:
                # Prepare data for COPY
                buffer = StringIO()
                for record in all_forex_data:
                    buffer.write(f"{record['date'].strftime('%Y-%m-%d')}\t{record['forex_pair']}\t{record['price']}\n")
                buffer.seek(0)

                conn = get_postgres_connection()
                
                try:
                    with conn.cursor() as cur:
                        # Copy data directly to the main table
                        cur.execute("SET search_path TO raw")
                        cur.copy_from(buffer, 'historical_forex', columns=('date', 'forex_pair', 'price'))
                        conn.commit()
                        logger.info(f"Successfully stored {len(all_forex_data)} historical prices for batch of {len(pairs)} forex pairs")
                finally:
                    conn.close()

        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            raise


    async def save_historical_forex(self):
        """Fetch historical forex data and store it in the database."""

        print("\n")
        logger.info(f"######################### Step 3 - HistoricalForexManager initialized with start_date={self.start_date}, end_date={self.end_date}")

        try:
            # Create table if it doesn't exist
            await self.create_forex_table()
            
            # Check if table already has data
            if await self.has_forex_data():
                logger.warning("Historical forex table already contains data. Aborting save operation.")
                return False

            # Get forex pairs
            pairs = await self.get_forex_pairs()
            if not pairs:
                logger.error("No forex pairs found")
                return False

            # Process pairs in batches of 100
            batch_size = 100
            total_batches = (len(pairs) + batch_size - 1) // batch_size
            
            for i in range(0, len(pairs), batch_size):
                batch_start_time = datetime.now().timestamp()
                logger.info(f"Processing batch {i//batch_size + 1} of {total_batches}")

                batch = pairs[i:i + batch_size]
                await self.process_forex_batch(batch)
                
                batch_end_time = datetime.now().timestamp()
                batch_duration = batch_end_time - batch_start_time
                logger.info(f"Batch {i//batch_size + 1} took {batch_duration:.2f} seconds to complete")

                # Add a small delay between batches to avoid overwhelming the API
                if i + batch_size < len(pairs):
                    await asyncio.sleep(1)

            logger.info("Historical forex data collection completed/n")
            return True

        except Exception as e:
            logger.error(f"Error saving historical forex data: {str(e)}")
            raise

if __name__ == "__main__":
    forex_manager = HistoricalForexManager()
    asyncio.run(forex_manager.save_historical_forex())