import asyncio
from ..fmp_api import FMPAPI
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime, timedelta
from io import StringIO
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import MarketCapValidator, McapFxValidator
from typing import Dict, List, Optional
from ..historical.historical_market_cap import HistoricalMcapFxConverter

# Get logger
logger = get_logger(__name__)

# Load environment variables
load_dotenv()

class DailyMcapManager:
    """
    Fetches market cap data for all symbols on thier LAST AVAILABLE DAY (might not be yesterday).
    Then it deletes the existing data for those symbol-date combinations, and inserts the new data.
    """
    def __init__(self):

        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()


    async def get_symbols_from_db(self) -> List[tuple]:
        """Get all symbols from the historical_market_cap table with their currency info."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT DISTINCT hmc.symbol, hmc.currency 
                    FROM raw.historical_market_cap hmc
                """))
                symbols_with_currency = [(row[0], row[1]) for row in result]
                logger.info(f"Retrieved {len(symbols_with_currency)} symbols from historical_market_cap")
                return symbols_with_currency
        except Exception as e:
            logger.error(f"Error getting symbols from database: {str(e)}")
            raise

    async def run_daily_update(self) -> None:
        """Main method to run the daily market cap update process."""

        print("\n")
        logger.info("######################### Step 5 - DailyMcapManager initialized")
        try:
            logger.info("Starting daily market cap update...")
            
            # Get all symbols from database
            symbols_with_currency = await self.get_symbols_from_db()
            if not symbols_with_currency:
                logger.error("No symbols found in database")
                return
            
            # Extract just the symbols for the API call
            symbols = [s[0] for s in symbols_with_currency]
            # Create a mapping of symbol to currency
            currency_map = {s[0]: s[1] for s in symbols_with_currency}
            
            # Process symbols in parallel batches of 1000 with 5 concurrent requests
            batch_size = 1000
            max_concurrent_requests = 5
            all_mcap_data = []
            
            logger.info(f"Processing {len(symbols)} symbols in batches with {max_concurrent_requests} parallel requests")
            
            # Process batches in parallel groups
            for i in range(0, len(symbols), batch_size * max_concurrent_requests):
                # Create up to 5 concurrent batch tasks
                batch_tasks = []
                for j in range(max_concurrent_requests):
                    batch_start = i + (j * batch_size)
                    if batch_start >= len(symbols):
                        break
                    
                    batch_end = min(batch_start + batch_size, len(symbols))
                    batch = symbols[batch_start:batch_end]
                    
                    if batch:
                        task = self._process_single_batch(batch, currency_map, batch_start // batch_size + 1)
                        batch_tasks.append(task)
                
                if batch_tasks:
                    logger.info(f"Processing {len(batch_tasks)} parallel batches")
                    
                    # Execute all batch tasks concurrently
                    batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                    
                    # Collect results from all batches
                    for result in batch_results:
                        if isinstance(result, Exception):
                            logger.error(f"Batch processing error: {str(result)}")
                        elif result:
                            all_mcap_data.extend(result)
                
                # Small delay between parallel groups to avoid overwhelming the API
                if i + (batch_size * max_concurrent_requests) < len(symbols):
                    logger.info("Sleeping for 2 seconds between parallel groups")
                    await asyncio.sleep(2)
            
            if not all_mcap_data:
                logger.warning("No market cap data fetched")
                return
            
            # Find the most frequent date in all_mcap_data
            date_counts = {}
            for record in all_mcap_data:
                date = record['date']
                date_counts[date] = date_counts.get(date, 0) + 1
            
            if not date_counts:
                logger.warning("No valid dates found in market cap data")
                return
            
            # Find the date that appears most frequently
            most_frequent_date = max(date_counts, key=date_counts.get)
            most_frequent_count = date_counts[most_frequent_date]
            
            # Get sorted dates by frequency (descending)
            sorted_dates = sorted(date_counts.items(), key=lambda x: x[1], reverse=True)
            
            # Log the top 3 most frequent dates
            log_message = f"Most frequent date: {most_frequent_date.date()} with {most_frequent_count} records"
            if len(sorted_dates) > 1:
                log_message += f", 2nd most frequent: {sorted_dates[1][0].date()} with {sorted_dates[1][1]} records"
            if len(sorted_dates) > 2:
                log_message += f", 3rd most frequent: {sorted_dates[2][0].date()} with {sorted_dates[2][1]} records"
            
            logger.info(log_message)
            
            # Filter all_mcap_data to only keep records with the most frequent date
            filtered_mcap_data = [record for record in all_mcap_data if record['date'] == most_frequent_date]
            
            logger.info(f"Filtered to {len(filtered_mcap_data)} records for date {most_frequent_date.date()} (removed {len(all_mcap_data) - len(filtered_mcap_data)} records with other dates)")
            
            # Delete all records from historical_market_cap with the most frequent date
            total_deleted = 0
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    DELETE FROM raw.historical_market_cap 
                    WHERE date = :date
                """), {"date": most_frequent_date})
                total_deleted = result.rowcount
                conn.commit()
                
                if total_deleted > 0:
                    logger.info(f"Deleted {total_deleted} existing market cap records for date {most_frequent_date.date()}")
                else:
                    logger.info(f"No existing records found for date {most_frequent_date.date()}")
            
            # Insert the filtered data
            logger.info(f"Inserting {len(filtered_mcap_data)} market cap records for date {most_frequent_date.date()}")
            
            # Create a string buffer for COPY
            buffer = StringIO()
            for record in filtered_mcap_data:
                buffer.write(f"{record['date'].date()}\t{record['symbol']}\t{record['currency']}\t{record['market_cap']}\n")
            buffer.seek(0)

            conn = get_postgres_connection()
            
            try:
                with conn.cursor() as cur:
                    cur.execute("SET search_path TO raw")
                    cur.copy_from(buffer, 'historical_market_cap', columns=('date', 'symbol', 'currency', 'market_cap'))
                    conn.commit()
                    logger.info(f"Successfully stored {len(filtered_mcap_data)} market cap records for date {most_frequent_date.date()}")
            finally:
                conn.close()
            
            logger.info("Daily market cap update completed successfully.")
            
        except Exception as e:
            logger.error(f"Error in daily market cap update: {str(e)}")
            raise

    async def _process_single_batch(self, symbols_batch: List[str], currency_map: Dict[str, str], batch_num: int) -> List[Dict]:
        """Process a single batch of symbols and return validated market cap data."""
        try:
            logger.info(f"Processing batch {batch_num} with {len(symbols_batch)} symbols")
            
            # Get current market cap data for this batch
            market_cap_data = await self.fmp.get_market_cap_batch(symbols_batch)
            
            if not market_cap_data:
                logger.warning(f"No market cap data received from API for batch {batch_num}")
                return []
            
            # Process the batch results
            batch_mcap_data = []
            for mcap_record in market_cap_data:
                try:
                    symbol = mcap_record.get('symbol')
                    market_cap = mcap_record.get('marketCap')
                    date=mcap_record.get('date')
                    date_obj = datetime.strptime(date, '%Y-%m-%d')
                    
                    if not symbol or market_cap is None:
                        continue
                    
                    # Validate the record using Pydantic model
                    validated_record = MarketCapValidator(
                        date=date_obj,
                        symbol=symbol,
                        currency=currency_map.get(symbol),
                        market_cap=int(market_cap)
                    )
                    batch_mcap_data.append(validated_record.model_dump())
                    
                except Exception as e:
                    logger.warning(f"Validation failed for {mcap_record}: {e}")
                    continue
            
            #logger.info(f"Batch {batch_num} processed: {len(batch_mcap_data)} valid records")
            return batch_mcap_data
            
        except Exception as e:
            logger.error(f"Error processing batch {batch_num}: {str(e)}")
            return []


##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################


class DailyMcapFxConverter:
    """
    Fetches the missing dates from the last 5 days and does fx conversion (if market_cap_eur or others are NULL)
    Since the DailyMcapManager deletes the last available day on runtime, at least one day should have missing data
    """
    def __init__(self):
        """Initialize the DailyMcapFxConverter with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self._get_fx_conversion_sql = HistoricalMcapFxConverter()._get_fx_conversion_sql

    async def get_missing_fx_dates(self) -> list:
        """Get list of dates that need FX conversion in historical_market_cap table in the last 5 days."""
        try:
            # Calculate date range for last 5 days
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=5)
            
            with self.engine.connect() as conn:
                # Find dates where market_cap_eur or market_cap_usd are NULL in the last 5 days
                result = conn.execute(text("""
                    SELECT DISTINCT date
                    FROM raw.historical_market_cap
                    WHERE (market_cap_eur = 0 
                       OR market_cap_eur IS NULL
                       OR market_cap_usd = 0
                       OR market_cap_usd IS NULL)
                      AND date >= :start_date AND date <= :end_date
                    ORDER BY date
                """), {"start_date": start_date, "end_date": end_date})
                missing_dates = [row[0] for row in result]
                
                if not missing_dates:
                    logger.info("No dates found that need FX conversion in the last 5 days")
                    return []
                
                logger.info(f"Found {len(missing_dates)} dates needing FX conversion in the last 5 days")
                return missing_dates
                
        except Exception as e:
            logger.error(f"Error getting missing FX dates: {str(e)}")
            raise

    async def run_daily_fx_conversion(self):
        """Main method to run the daily FX conversion process."""

        print("\n")
        logger.info("######################### Step 6 - DailyMcapFxConverter initialized")
        try:
            logger.info("Starting daily market cap FX conversion...")
            
            # Get dates that need FX conversion
            missing_dates = await self.get_missing_fx_dates()
            
            if not missing_dates:
                logger.info("No dates need FX conversion")
                return True
            
            # Use the same SQL logic as HistoricalMcapFxConverter but for specific dates
            await self._convert_fx_for_dates(missing_dates)
            
            logger.info("Daily market cap FX conversion completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error in daily FX conversion: {str(e)}")
            raise

    def _adapt_sql_for_single_date(self, sql):
        """Adapt the historical converter's SQL for single-date processing."""
        # Convert SQL text to string and replace date range parameters with single date
        sql_str = str(sql)
        sql_str = sql_str.replace(":d_start AND hmc.date < :d_next", ":date")
        sql_str = sql_str.replace(":d_start AND mem.date < :d_next", ":date")
        
        # Modify the market cap conditions to remove market cap checks
        sql_str = sql_str.replace("WHEN hmc.market_cap = 0 OR hmc.market_cap IS NULL OR fe.price IS NULL OR fe.price < 1e-6 THEN 0", 
                                  "WHEN fe.price IS NULL OR fe.price < 1e-6 THEN 0")
        sql_str = sql_str.replace("WHEN mem.market_cap = 0 OR mem.market_cap IS NULL OR fu.price IS NULL OR fu.price < 1e-6 THEN 0", 
                                  "WHEN fu.price IS NULL OR fu.price < 1e-6 THEN 0")
        
        return text(sql_str)

    def _validate_fx_data(self, date):
        """Validate FX data for a specific date using McapFxValidator."""
        try:
            with self.engine.connect() as conn:
                # Get records for the date that have FX data
                result = conn.execute(text("""
                    SELECT date, symbol, currency, market_cap, 
                           market_cap_eur, market_cap_usd
                    FROM raw.historical_market_cap
                    WHERE date = :date 
                      AND market_cap_eur IS NOT NULL 
                      AND market_cap_usd IS NOT NULL
                """), {"date": date})
                
                records = result.fetchall()
                validated_count = 0
                invalid_count = 0
                
                for record in records:
                    try:
                        # Validate using McapFxValidator
                        validated_record = McapFxValidator(
                            date=record[0],
                            symbol=record[1],
                            currency=record[2],
                            market_cap=int(record[3]),
                            market_cap_eur=int(record[4]),
                            market_cap_usd=int(record[5])
                        )
                        validated_count += 1
                    except Exception as e:
                        logger.warning(f"Validation failed for {record[1]} on {date}: {e}")
                        invalid_count += 1
                
                logger.info(f"FX validation for {date}: {validated_count} valid, {invalid_count} invalid records")
                return validated_count, invalid_count
                
        except Exception as e:
            logger.error(f"Error validating FX data for {date}: {str(e)}")
            return 0, 0

    async def _convert_fx_for_dates(self, dates: list):
        """Convert FX for specific dates using the same logic as HistoricalMcapFxConverter."""
        try:
            if not dates:
                logger.info("No dates to process for FX conversion")
                return
            
            # Process each date
            for date in dates:
                logger.info(f"Processing FX conversion for date: {date}")
                
                # Use the imported SQL method from HistoricalMcapFxConverter and adapt it for single date
                sql = self._adapt_sql_for_single_date(self._get_fx_conversion_sql())
                
                with self.engine.connect() as conn:
                    result = conn.execute(sql, {"date": date})
                    conn.commit()
                    logger.info(f"Completed FX conversion for date {date}")
                
                # Validate FX data after conversion
                validated_count, invalid_count = self._validate_fx_data(date)
                if invalid_count > 0:
                    logger.warning(f"Found {invalid_count} invalid FX records for date {date}")
            
            logger.info(f"Successfully processed FX conversion for {len(dates)} dates")
                
        except Exception as e:
            logger.error(f"Error processing FX conversion: {str(e)}")
            raise 



if __name__ == "__main__":
    mcap_manager = DailyMcapManager() # Update Market Cap data
    asyncio.run(mcap_manager.run_daily_update())

    mcap_fx_converter = DailyMcapFxConverter() # Convert Market Cap to EUR and USD
    asyncio.run(mcap_fx_converter.run_daily_fx_conversion())