import os
import csv
import asyncio
from io import StringIO
from ..fmp_api import FMPAPI
from dotenv import load_dotenv
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import PriceVolumeValidator, PriceVolumeFxValidator
from ..historical.historical_price_volume import HistoricalPriceVolumeFxConverter

# Get logger
logger = get_logger(__name__)

load_dotenv()
class DailyPriceVolumeManager:
    """
    Fetches missing dates between yesterday and last available date in the price volume table
    Weekends are skipped
    If no dates are missing, it will delete and process yesterday's data again
    """
    def __init__(self):

        self.fmp = FMPAPI()
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

    async def get_missing_dates(self) -> list:
        """Get list of dates that are missing from historical_price_volume table."""
        try:
            with self.engine.connect() as conn:
                # Create raw schema if it doesn't exist
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.commit()
                
                # Get the last available date
                result = conn.execute(text("""
                    SELECT MAX(date) as last_date 
                    FROM raw.historical_price_volume
                """))
                last_processed_date = result.scalar()
                
                if not last_processed_date:
                    raise ValueError("No data found in historical_price_volume table")
                
                # Get yesterday's date
                yesterday = (datetime.now() - timedelta(days=1)).date()
                first_empty_date = last_processed_date + timedelta(days=1)
                
                # Generate list of missing dates
                missing_dates = []
                current_date = first_empty_date
                while current_date <= yesterday:
                    # Skip weekends
                    if current_date.weekday() < 5:  # 0-4 are weekdays
                        missing_dates.append(current_date.strftime("%Y-%m-%d"))
                    current_date += timedelta(days=1)
                
                logger.info(f"Found {len(missing_dates)} missing dates from {first_empty_date} to {yesterday}")
                return missing_dates
                
        except Exception as e:
            logger.error(f"Error getting missing dates: {str(e)}")
            raise


    async def get_existing_symbols(self) -> list:
        """Get list of symbols that exist in historical_price_volume table."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT DISTINCT symbol 
                    FROM raw.historical_price_volume
                """))
                symbols = [row[0] for row in result]
                logger.info(f"Found {len(symbols)} existing symbols")
                return symbols
                
        except Exception as e:
            logger.error(f"Error getting existing symbols: {str(e)}")
            raise


    async def get_daily_price_volume(self, date: str = None) -> dict:

        try:
            # Use today's date if none provided
            if date is None:
                logger.error("Date is required to fetch daily prices")
                return {}
            
            logger.info(f"Fetching daily prices for date: {date}")
            
            # Get CSV data from API
            csv_text = await self.fmp.get_eod_bulk(date)
            
            # Parse CSV and create dictionary with symbol as key
            csv_file = StringIO(csv_text)
            csv_reader = csv.DictReader(csv_file)
            data_dict = {row['symbol']: row for row in csv_reader}
            
            logger.info(f"Successfully retrieved {len(data_dict)} daily price records")
            return data_dict
            
        except Exception as e:
            logger.error(f"Error fetching daily prices: {str(e)}")
            raise


    async def get_symbol_currencies(self, symbols: list) -> dict:
        """Get currency information for the given symbols from stock_info table."""
        try:
            with self.engine.connect() as conn:
                # Convert symbols list to a format suitable for SQL IN clause
                symbols_str = ','.join([f"'{symbol}'" for symbol in symbols])
                result = conn.execute(text(f"""
                    SELECT symbol, currency
                    FROM raw.stock_info
                    WHERE symbol IN ({symbols_str})
                """))
                currency_map = {row[0]: row[1] for row in result}
                logger.info(f"Found currency information for {len(currency_map)} symbols")
                return currency_map
                
        except Exception as e:
            logger.error(f"Error getting symbol currencies: {str(e)}")
            raise


    async def save_daily_price_volume(self, date: str, prices: dict, symbols: list) -> None:

        try:
            # Delete existing data for this date to ensure fresh insertion
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                                           DELETE FROM raw.historical_price_volume 
                                           WHERE date = :date
                                           """), {"date": date})
                deleted_count = result.rowcount
                conn.commit()
                
                if deleted_count > 0:
                    logger.info(f"Deleted {deleted_count} existing price/volume records for {date}")
            
            # Get currency information for all symbols
            currency_map = await self.get_symbol_currencies(symbols)
            
            # Filter and validate prices for existing symbols
            validated_prices = []
            for symbol in symbols:
                if symbol not in prices:
                    continue
                
                try:
                    # Convert date string to datetime
                    price_date = datetime.strptime(date, '%Y-%m-%d')
                    
                    # Create and validate record using Pydantic model
                    validated_record = PriceVolumeValidator(
                        date=price_date,
                        symbol=symbol,
                        currency=currency_map.get(symbol),
                        close=float(prices[symbol]['close']),
                        volume=int(float(prices[symbol]['volume']))
                    )
                    validated_prices.append(validated_record.model_dump())
                except Exception as e:
                    logger.warning(f"Validation failed for {symbol} on {date}: {e}")
                    continue
            
            if not validated_prices:
                logger.warning(f"No valid prices to save for date {date}")
                return
            
            # Bulk insert into database
            with self.engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO raw.historical_price_volume (date, symbol, currency, close, volume)
                    VALUES (:date, :symbol, :currency, :close, :volume)
                    --ON CONFLICT (date, symbol) DO UPDATE
                    --SET close = EXCLUDED.close,
                    --     volume = EXCLUDED.volume,
                    --     currency = EXCLUDED.currency
                """), validated_prices)
                conn.commit()
                
            logger.info(f"Successfully saved {len(validated_prices)} prices for date {date}")
            
        except Exception as e:
            logger.error(f"Error saving daily prices: {str(e)}")
            raise


    async def run_daily_update(self) -> None:
        """Update historical prices for all missing dates, or yesterday if no missing dates."""

        print("\n")
        logger.info("######################### Step 3 - DailyPriceVolumeManager initialized")
        try:
            # Get missing dates
            missing_dates = await self.get_missing_dates()
            
            # Get existing symbols
            symbols = await self.get_existing_symbols()
            if not symbols:
                logger.warning("No existing symbols found")
                return
            
            if not missing_dates:
                logger.info("No missing dates found, processing yesterday's data")
                # Calculate yesterday's date
                yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                missing_dates = [yesterday]
            
            # Process each date (missing dates or yesterday)
            for date in missing_dates:
                print("\n")
                logger.info(f"Processing date: {date}")
                
                # Get prices for the date
                prices = await self.get_daily_price_volume(date)
                
                # Save filtered prices
                await self.save_daily_price_volume(date, prices, symbols)
                
                # Add a small delay between API calls
                await asyncio.sleep(1)
            
            logger.info("Historical prices update completed")
            
        except Exception as e:
            logger.error(f"Error updating historical prices: {str(e)}")
            raise



##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################





class DailyPriceVolumeFxConverter:
    """
    Fetches the missing data from within the last 7 days, and does fx conversion (if close_eur or others are NULL)
    Since the DailyPriceVolumeManager deletes the last day on runtime, at least one day will have missing data
    """
    def __init__(self):

        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self._get_fx_conversion_sql = HistoricalPriceVolumeFxConverter()._get_fx_conversion_sql

    async def get_missing_fx_dates(self) -> list:
        """Get list of dates that need FX conversion in historical_price_volume table in the last 7 days."""
        try:
            # Calculate date range for last 7 days
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=7)
            
            with self.engine.connect() as conn:
                # Find dates where close_eur, close_usd, volume_eur, or volume_usd are NULL in the last 7 days
                result = conn.execute(text("""
                    SELECT DISTINCT date
                    FROM raw.historical_price_volume
                    WHERE (close_eur IS NULL 
                       OR close_usd IS NULL 
                       OR volume_eur IS NULL 
                       OR volume_usd IS NULL)
                      AND date >= :start_date AND date <= :end_date
                    ORDER BY date
                """), {"start_date": start_date, "end_date": end_date})
                missing_dates = [row[0] for row in result]
                
                if not missing_dates:
                    logger.info("No dates found that need FX conversion in the last 7 days")
                    return []
                
                logger.info(f"Found {len(missing_dates)} dates needing FX conversion in the last 7 days")
                return missing_dates
                
        except Exception as e:
            logger.error(f"Error getting missing FX dates: {str(e)}")
            raise

    async def run_daily_fx_conversion(self):
        """Main method to run the daily FX conversion process."""

        print("\n")
        logger.info("######################### Step 4 - DailyPriceVolumeFxConverter initialized")
        try:
            logger.info("Starting daily price volume FX conversion...")
            
            # Get dates that need FX conversion
            missing_dates = await self.get_missing_fx_dates()
            
            if not missing_dates:
                logger.info("No dates need FX conversion")
                return True
            
            # Use the same SQL logic as HistoricalPriceVolumeFxConverter but for specific dates
            await self._convert_fx_for_dates(missing_dates)
            
            logger.info("Daily price volume FX conversion completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error in daily FX conversion: {str(e)}")
            raise

    def _adapt_sql_for_single_date(self, sql):
        """Adapt the historical converter's SQL for single-date processing."""
        # Convert SQL text to string and replace date range parameters with single date
        sql_str = str(sql)
        sql_str = sql_str.replace(":d_start AND hpv.date < :d_next", ":date")
        sql_str = sql_str.replace(":d_start AND pve.date < :d_next", ":date")
        return text(sql_str)

    def _validate_fx_data(self, date):
        """Validate FX data for a specific date using PriceVolumeFxValidator."""
        try:
            with self.engine.connect() as conn:
                # Get records for the date that have FX data
                result = conn.execute(text("""
                    SELECT date, symbol, currency, close, volume, 
                           close_eur, close_usd, volume_eur, volume_usd
                    FROM raw.historical_price_volume
                    WHERE date = :date 
                      AND close_eur IS NOT NULL 
                      AND close_usd IS NOT NULL 
                      AND volume_eur IS NOT NULL 
                      AND volume_usd IS NOT NULL
                """), {"date": date})
                
                records = result.fetchall()
                validated_count = 0
                invalid_count = 0
                
                for record in records:
                    try:
                        # Validate using PriceVolumeFxValidator
                        validated_record = PriceVolumeFxValidator(
                            date=record[0],
                            symbol=record[1],
                            currency=record[2],
                            close=float(record[3]),
                            volume=int(record[4]),
                            close_eur=float(record[5]),
                            close_usd=float(record[6]),
                            volume_eur=int(record[7]),
                            volume_usd=int(record[8])
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
        """Convert FX for specific dates using the same logic as HistoricalPriceVolumeFxConverter."""
        try:
            if not dates:
                logger.info("No dates to process for FX conversion")
                return

            for date in dates:
                logger.info(f"Processing FX conversion for date: {date}")
                
                # Use the imported SQL method from HistoricalPriceVolumeFxConverter and adapt it for single date
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
    price_manager = DailyPriceVolumeManager()  # Update Price and Volume data
    asyncio.run(price_manager.run_daily_update())

    price_volume_fx_converter = DailyPriceVolumeFxConverter() # Convert Prices and Volumes to EUR and USD
    asyncio.run(price_volume_fx_converter.run_daily_fx_conversion())