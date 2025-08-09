import asyncio
from ..fmp_api import FMPAPI
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import json
from ..utils.utils import get_database_url, get_logger

# Get logger
logger = get_logger(__name__)

# Load environment variables
load_dotenv()

class StockSymbolsManager:
    def __init__(self):
        """Initialize the StockSymbolsManager with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()


    async def create_table(self):
        """Create the stock_symbols table if it doesn't exist."""
        with self.engine.connect() as conn:
            # Create raw schema if it doesn't exist
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
            conn.commit()
            
            # Check if table exists and clear data if it does
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'raw' 
                    AND table_name = 'stock_symbols'
                )
            """)).scalar()
            
            if result:
                logger.info("Stock symbols table exists, clearing all data...")
                conn.execute(text("DELETE FROM raw.stock_symbols"))
                conn.commit()
                logger.info("All data cleared from raw.stock_symbols table")
            else:
                logger.info("Creating stock symbols table in raw schema...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS raw.stock_symbols (
                    symbol VARCHAR(100) PRIMARY KEY,
                    company_name VARCHAR(255),
                    trading_currency VARCHAR(10),
                    reporting_currency VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            logger.info("Stock symbols table created/verified in raw schema")


    async def has_data(self) -> bool:
        """Check if the stock_symbols table has any data."""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM raw.stock_symbols")).scalar()
            has_data = result > 0
            if has_data:
                logger.info(f"Found {result} existing records in stock_symbols table")
            else:
                logger.info("No existing records found in stock_symbols table")
            return has_data


    async def save_stock_symbols(self):
        """Fetch stock symbols from API and store them in the database."""
        print("\n")
        logger.info("######################### Step 1 - StockSymbolsManager initialized")
        # Create table if it doesn't exist
        await self.create_table()
        
        # Check if table already has data
        if await self.has_data():
            logger.warning("Stock symbols table already contains data. Aborting save operation.")
            return False

        # Get stock symbols from API
        logger.info("Fetching stock symbols from API...")
        stock_symbols = await self.fmp.get_stock_symbols()

        if not stock_symbols:
            logger.warning("No stock symbols received from API")
            return False


        
        # Debug: Log the first few symbols to see their structure
        logger.debug("First few stock symbols from API:")
        for stock in stock_symbols[:5]:
            logger.debug(json.dumps(stock, indent=2))
        
        # Store symbols in database
        with self.engine.connect() as conn:
            for stock in stock_symbols:
                try:
                    conn.execute(text("""
                        INSERT INTO raw.stock_symbols (symbol, company_name, trading_currency, reporting_currency)
                        VALUES (:symbol, :company_name, :trading_currency, :reporting_currency)
                        ON CONFLICT (symbol) DO UPDATE
                        SET company_name = EXCLUDED.company_name,
                            trading_currency = EXCLUDED.trading_currency,
                            reporting_currency = EXCLUDED.reporting_currency
                    """), {
                        'symbol': stock.get('symbol', ''),
                        'company_name': stock.get('companyName', ''),
                        'trading_currency': stock.get('tradingCurrency', ''),
                        'reporting_currency': stock.get('reportingCurrency', '')
                    })
                except Exception as e:
                    logger.error(f"Error processing stock: {json.dumps(stock, indent=2)}")
                    logger.error(f"Error details: {str(e)}")
                    raise
            conn.commit()
        
        logger.info(f"Successfully stored {len(stock_symbols)} stock symbols in the database")
        return True