import asyncio
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from ..utils.utils import get_postgres_connection, get_database_url, get_logger

# Get logger
logger = get_logger(__name__)

class VolAvgManager:
    def __init__(self):
        """Initialize the VolAvgManager with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

    async def get_latest_forex_date_with_sufficient_pairs(self):
        """Get the latest date from historical_forex table that has at least 200 forex pairs."""
        try:
            with self.engine.connect() as conn:
                # Query to find the latest date with at least 200 forex pairs
                result = conn.execute(text("""
                    WITH date_counts AS (
                        SELECT date, COUNT(DISTINCT forex_pair) as pair_count
                        FROM raw.historical_forex
                        GROUP BY date
                        HAVING COUNT(DISTINCT forex_pair) >= 200
                    )
                    SELECT date, pair_count
                    FROM date_counts
                    ORDER BY date DESC
                    LIMIT 1
                """))
                
                row = result.fetchone()
                if row:
                    latest_date, pair_count = row
                    logger.info(f"Found latest date {latest_date} with {pair_count} forex pairs")
                    return latest_date
                else:
                    logger.warning("No date found with at least 200 forex pairs")
                    return None
        except Exception as e:
            logger.error(f"Error getting latest forex date: {str(e)}")
            raise

    async def get_forex_rates_for_date(self, date):
        """Get all forex rates for a specific date."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT forex_pair, price
                    FROM raw.historical_forex
                    WHERE date = :date
                """), {"date": date})
                
                forex_rates = {}
                for row in result:
                    forex_pair, price = row
                    forex_rates[forex_pair] = float(price)
                
                logger.info(f"Retrieved {len(forex_rates)} forex rates for date {date}")
                return forex_rates
        except Exception as e:
            logger.error(f"Error getting forex rates for date {date}: {str(e)}")
            raise


    async def add_currency_columns_to_stock_info(self):
        """Add vol_avg_EUR and vol_avg_USD columns to stock_info table if they don't exist."""
        try:
            with self.engine.connect() as conn:
                # Check if columns already exist
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'raw' 
                    AND table_name = 'stock_info' 
                    AND column_name IN ('vol_avg_eur', 'vol_avg_usd')
                """))
                
                existing_columns = [row[0] for row in result]
                
                # Add vol_avg_EUR column if it doesn't exist
                if 'vol_avg_eur' not in existing_columns:
                    conn.execute(text("""
                        ALTER TABLE raw.stock_info 
                        ADD COLUMN vol_avg_EUR BIGINT
                    """))
                    logger.info("Added vol_avg_EUR column to stock_info table")
                
                # Add vol_avg_USD column if it doesn't exist
                if 'vol_avg_usd' not in existing_columns:
                    conn.execute(text("""
                        ALTER TABLE raw.stock_info 
                        ADD COLUMN vol_avg_USD BIGINT
                    """))
                    logger.info("Added vol_avg_USD column to stock_info table")
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error adding currency columns: {str(e)}")
            raise

    async def convert_currency(self, amount, from_currency, to_currency, forex_rates):
        """Convert amount from one currency to another using forex rates."""
        if amount is None:
            return None
            
        amount = float(amount)
        
        # If currencies are the same, no conversion needed
        if from_currency == to_currency:
            return int(round(amount))
        
        # Construct forex pair: target_currency + source_currency (e.g., EURUSD for EUR target, USD source)
        forex_pair = f"{to_currency}{from_currency}"
        
        if forex_pair in forex_rates:
            # Divide the amount by the forex rate
            converted_amount = amount / forex_rates[forex_pair]
            return int(round(converted_amount))
        else:
            logger.warning(f"No forex rate found for pair {forex_pair}")
            return None

    async def update_currency_columns(self):
        """Update vol_avg_EUR and vol_avg_USD columns in stock_info table."""
        try:
            # Get the latest date with sufficient forex pairs
            latest_date = await self.get_latest_forex_date_with_sufficient_pairs()
            if not latest_date:
                logger.error("Cannot proceed without sufficient forex data")
                return False
            
            # Get forex rates for that date
            forex_rates = await self.get_forex_rates_for_date(latest_date)
            if not forex_rates:
                logger.error("No forex rates found for the selected date")
                return False
            
            # Add currency columns if they don't exist
            await self.add_currency_columns_to_stock_info()
            
            # Get all stock info records
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT symbol, vol_avg, currency
                    FROM raw.stock_info
                    WHERE vol_avg IS NOT NULL AND currency IS NOT NULL
                """))
                
                stock_records = result.fetchall()
                logger.info(f"Processing {len(stock_records)} stock records for currency conversion")
                
                # Process each record
                updates = []
                for symbol, vol_avg, currency in stock_records:
                    # Convert to EUR
                    vol_avg_eur = await self.convert_currency(vol_avg, currency, 'EUR', forex_rates)
                    
                    # Convert to USD
                    vol_avg_usd = await self.convert_currency(vol_avg, currency, 'USD', forex_rates)
                    
                    updates.append({
                        'symbol': symbol,
                        'vol_avg_eur': vol_avg_eur,
                        'vol_avg_usd': vol_avg_usd
                    })
                
                # Batch update all records
                conn = get_postgres_connection()
                try:
                    with conn.cursor() as cur:
                        cur.execute("SET search_path TO raw")
                        
                        for update in updates:
                            cur.execute("""
                                UPDATE stock_info 
                                SET vol_avg_EUR = %s, vol_avg_USD = %s
                                WHERE symbol = %s
                            """, (update['vol_avg_eur'], update['vol_avg_usd'], update['symbol']))
                        
                        conn.commit()
                        logger.info(f"Successfully updated currency columns for {len(updates)} records")
                        
                finally:
                    conn.close()
                    
            return True
            
        except Exception as e:
            logger.error(f"Error updating currency columns: {str(e)}")
            raise

    async def run_update(self):
        """Main method to run the currency conversion update."""

        print("\n")
        logger.info("######################### Step 5 - VolAvgManager initialized")
        try:
            logger.info("Starting stock info currency conversion update...")
            
            success = await self.update_currency_columns()
            if success:
                logger.info("Stock info currency conversion completed successfully")
            else:
                logger.error("Stock info currency conversion failed")
                
            return success
            
        except Exception as e:
            logger.error(f"Error in stock info update: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(VolAvgManager().run_update())


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

class RelevanceManager:
    def __init__(self):
        """Initialize the RelevanceManager with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

    async def add_relevant_column_to_stock_info(self):
        """Add relevant column to stock_info table if it doesn't exist."""
        try:
            with self.engine.connect() as conn:
                # Check if column already exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'raw' 
                    AND table_name = 'stock_info' 
                    AND column_name = 'relevant'
                """))
                
                existing_column = result.fetchone()
                
                # Add relevant column if it doesn't exist
                if not existing_column:
                    conn.execute(text("""
                        ALTER TABLE raw.stock_info 
                        ADD COLUMN relevant BOOLEAN DEFAULT FALSE
                    """))
                    logger.info("Added relevant column to stock_info table")
                    conn.commit()
                else:
                    logger.info("Relevant column already exists in stock_info table")
                
        except Exception as e:
            logger.error(f"Error adding relevant column: {str(e)}")
            raise

    async def update_relevance(self):
        """Update the relevant column based on highest vol_avg_USD per company_name."""
        try:
            # Add relevant column if it doesn't exist
            await self.add_relevant_column_to_stock_info()
            
            # First, set all records to not relevant
            with self.engine.connect() as conn:
                conn.execute(text("""
                    UPDATE raw.stock_info 
                    SET relevant = FALSE
                """))
                conn.commit()
                logger.info("Reset all records to not relevant")
            
            # Find records with highest vol_avg_USD per company_name
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    WITH ranked_companies AS (
                        SELECT 
                            symbol,
                            company_name,
                            vol_avg_usd,
                            ROW_NUMBER() OVER (
                                PARTITION BY company_name 
                                ORDER BY vol_avg_usd DESC NULLS LAST
                            ) as rank
                        FROM raw.stock_info
                        WHERE company_name IS NOT NULL 
                        AND vol_avg_usd IS NOT NULL
                        AND is_etf is FALSE
                        AND is_fund is FALSE
                        AND is_adr is FALSE
                        AND exchange_short_name IS NOT NULL
                        AND exchange_short_name <> 'OTC'
                    )
                    SELECT symbol, company_name, vol_avg_usd
                    FROM ranked_companies
                    WHERE rank = 1
                """))
                
                relevant_records = result.fetchall()
                logger.info(f"Found {len(relevant_records)} relevant records (highest vol_avg_USD per company)")
                
                # Update relevant records to TRUE
                conn = get_postgres_connection()
                try:
                    with conn.cursor() as cur:
                        cur.execute("SET search_path TO raw")
                        
                        for symbol, company_name, vol_avg_usd in relevant_records:
                            cur.execute("""
                                UPDATE stock_info 
                                SET relevant = TRUE
                                WHERE symbol = %s
                            """, (symbol,))
                        
                        conn.commit()
                        logger.info(f"Successfully marked {len(relevant_records)} records as relevant")
                        
                finally:
                    conn.close()
                    
            return True
            
        except Exception as e:
            logger.error(f"Error updating relevance: {str(e)}")
            raise

    async def run_update(self):
        """Main method to run the relevance update."""
        print("\n")
        logger.info("######################### Step 6 - RelevanceManager initialized")
        
        try:
            logger.info("Starting relevance update...")
            
            success = await self.update_relevance()
            if success:
                logger.info("Relevance update completed successfully")
            else:
                logger.error("Relevance update failed")
                
            return success
            
        except Exception as e:
            logger.error(f"Error in relevance update: {str(e)}")
            raise 





if __name__ == "__main__":
    vol_avg_manager = VolAvgManager() # Add vol_avg_EUR and vol_avg_USD columns in EUR and USD
    asyncio.run(vol_avg_manager.run_update())

    relevance_manager = RelevanceManager() # Update stock info relevance column
    asyncio.run(relevance_manager.run_update())