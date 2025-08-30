import asyncio
from datetime import datetime
from sqlalchemy import create_engine, text
from io import StringIO
from ..fmp_api import FMPAPI
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import StockInfoValidator

# Get logger
logger = get_logger(__name__)

class StockInfoManager:
    def __init__(self):
        """Initialize the StockInfoManager with database connection and FMP API."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()

    async def create_stock_info_table(self):
        """Create the stock_info table if it doesn't exist."""
        try:
            with self.engine.connect() as conn:
                # Create raw schema if it doesn't exist
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.commit()
                
                # Check if table exists and clear data if it does
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'stock_info'
                    )
                """)).scalar()
                
                if result:
                    logger.info("Stock info table exists, clearing all data...")
                    conn.execute(text("DELETE FROM raw.stock_info"))
                    conn.commit()
                    logger.info("All data cleared from raw.stock_info table")
                else:
                    logger.info("Creating stock info table in raw schema...")
                
                # Create stock_info table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS raw.stock_info (
                        symbol VARCHAR(20) PRIMARY KEY,
                        price DECIMAL(20, 4),
                        beta DECIMAL(20, 4),
                        vol_avg DECIMAL(20, 4),
                        mkt_cap DECIMAL(30, 4),
                        last_div DECIMAL(20, 4),
                        range VARCHAR(50),
                        changes DECIMAL(20, 4),
                        company_name VARCHAR(255),
                        currency VARCHAR(10),
                        cik VARCHAR(20),
                        isin VARCHAR(20),
                        cusip VARCHAR(20),
                        exchange VARCHAR(50),
                        exchange_short_name VARCHAR(20),
                        industry VARCHAR(100),
                        website VARCHAR(255),
                        description TEXT,
                        ceo VARCHAR(100),
                        sector VARCHAR(100),
                        country VARCHAR(100),
                        full_time_employees INTEGER,
                        phone VARCHAR(50),
                        address TEXT,
                        city VARCHAR(100),
                        state VARCHAR(100),
                        zip VARCHAR(20),
                        dcf_diff DECIMAL(20, 4),
                        dcf DECIMAL(20, 4),
                        image VARCHAR(255),
                        ipo_date DATE,
                        default_image BOOLEAN,
                        is_etf BOOLEAN,
                        is_actively_trading BOOLEAN,
                        is_adr BOOLEAN,
                        is_fund BOOLEAN,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.commit()
                logger.info("Stock info table created/verified in raw schema")
        except Exception as e:
            logger.error(f"Error creating stock info table: {str(e)}")
            raise

    async def get_symbols_from_db(self):
        """Get all symbols from the stock_symbols table."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT symbol FROM raw.stock_symbols"))
                symbols = [row[0] for row in result]
                logger.info(f"Retrieved {len(symbols)} symbols from database")
                return symbols
        except Exception as e:
            logger.error(f"Error getting symbols from database: {str(e)}")
            raise

    async def process_stock_info_batch(self, symbols: list):
        """Process a batch of symbols and store their stock info."""
        try:
            # Split symbols into chunks of 500 for each API call
            chunk_size = 500
            symbol_chunks = [symbols[i:i + chunk_size] for i in range(0, len(symbols), chunk_size)]
            
            # Process each chunk concurrently
            tasks = []
            for chunk in symbol_chunks:
                tasks.append(self.fmp.get_stock_info(chunk))
            
            # Wait for all API calls to complete
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and prepare data for bulk insert
            all_stock_info = []
            for chunk, result in zip(symbol_chunks, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Error fetching data for chunk: {str(result)}")
                    continue
                
                if not result:
                    logger.warning(f"No data found for chunk")
                    continue

                # Process each stock info in the chunk
                for stock_info in result:
                    try:
                        symbol = stock_info.get('symbol')
                        if not symbol:
                            continue

                        ### Convert date string to datetime if needed
                        if stock_info.get('ipoDate'):
                            try:
                                stock_info['ipoDate'] = datetime.strptime(stock_info['ipoDate'], '%Y-%m-%d').date()
                            except (ValueError, TypeError):
                                stock_info['ipoDate'] = None
                        else:
                            stock_info['ipoDate'] = None

                        
                        ### Convert boolean strings to actual booleans
                        for key in ['defaultImage', 'isEtf', 'isActivelyTrading', 'isAdr', 'isFund']:
                            if key in stock_info:
                                stock_info[key] = stock_info[key].lower() == 'true' if isinstance(stock_info[key], str) else stock_info[key]

                        ### Convert empty strings to None
                        for key in stock_info:
                            if stock_info[key] == '':
                                stock_info[key] = None

                        ### Map currency codes
                        currency = stock_info.get('currency')
                        if currency:
                            # Map specific currency codes
                            currency_mapping = {
                                'ILA': 'ILS',  
                                'KWF': 'KWD',
                                'ZAC': 'ZAR'
                            }
                            currency = currency_mapping.get(currency.upper(), currency)

                        # Prepare the record with all fields
                        record = {
                            'symbol': symbol,
                            'price': stock_info.get('price'),
                            'beta': stock_info.get('beta'),
                            'vol_avg': stock_info.get('volAvg'),
                            'mkt_cap': stock_info.get('mktCap'),
                            'last_div': stock_info.get('lastDiv'),
                            'range': stock_info.get('range'),
                            'changes': stock_info.get('changes'),
                            'company_name': stock_info.get('companyName'),
                            'currency': currency.upper() if currency else None,
                            'cik': stock_info.get('cik'),
                            'isin': stock_info.get('isin'),
                            'cusip': stock_info.get('cusip'),
                            'exchange': stock_info.get('exchange'),
                            'exchange_short_name': stock_info.get('exchangeShortName'),
                            'industry': stock_info.get('industry'),
                            'website': stock_info.get('website'),
                            'description': stock_info.get('description'),
                            'ceo': stock_info.get('ceo'),
                            'sector': stock_info.get('sector'),
                            'country': stock_info.get('country'),
                            'full_time_employees': stock_info.get('fullTimeEmployees'),
                            'phone': stock_info.get('phone'),
                            'address': stock_info.get('address'),
                            'city': stock_info.get('city'),
                            'state': stock_info.get('state'),
                            'zip': stock_info.get('zip'),
                            'dcf_diff': stock_info.get('dcfDiff'),
                            'dcf': stock_info.get('dcf'),
                            'image': stock_info.get('image'),
                            'ipo_date': stock_info.get('ipoDate'),
                            'default_image': stock_info.get('defaultImage'),
                            'is_etf': stock_info.get('isEtf'),
                            'is_actively_trading': stock_info.get('isActivelyTrading'),
                            'is_adr': stock_info.get('isAdr'),
                            'is_fund': stock_info.get('isFund')
                        }

                        # Validate the record using Pydantic model
                        validated_record = StockInfoValidator(**record)
                        all_stock_info.append(validated_record.model_dump())
                    except Exception as e:
                        logger.warning(f"Validation failed for {symbol}: {e}")
                        continue

            # Bulk insert all stock info using COPY
            if all_stock_info:
                # Prepare data for COPY
                buffer = StringIO()
                for record in all_stock_info:
                    # Convert all values to strings and handle None values
                    values = []
                    for value in record.values():
                        if value is None:
                            values.append('\\N')  # PostgreSQL NULL representation
                        elif isinstance(value, bool):
                            values.append(str(value).lower())
                        elif isinstance(value, (int, float)):
                            values.append(str(value))
                        elif isinstance(value, (datetime)):
                            values.append(value.strftime('%Y-%m-%d'))
                        else:
                            # Escape any special characters in strings including carriage returns
                            values.append(str(value).replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r'))
                    
                    buffer.write('\t'.join(values) + '\n')
                buffer.seek(0)

                conn = get_postgres_connection()
                try:
                    with conn.cursor() as cur:
                        cur.execute("SET search_path TO raw")
                        
                        # First delete existing records for these symbols
                        symbols_to_update = [record['symbol'] for record in all_stock_info]
                        cur.execute(
                            "DELETE FROM stock_info WHERE symbol = ANY(%s)",
                            (symbols_to_update,)
                        )
                        
                        # Copy data directly to the main table
                        cur.copy_from(buffer, 'stock_info', columns=tuple(all_stock_info[0].keys()))
                        conn.commit()
                        logger.info(f"Successfully stored/updated {len(all_stock_info)} stock info records")
                finally:
                    conn.close()

        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            raise

    async def has_stock_info_data(self) -> bool:
        """Check if the stock_info table has any data."""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM raw.stock_info")).scalar()
                has_data = result > 0
                if has_data:
                    logger.info(f"Found {result} existing records in stock_info table")
                else:
                    logger.info("No existing records found in stock_info table")
                return has_data
        except Exception as e:
            logger.error(f"Error checking stock info data: {str(e)}")
            raise

    async def update_stock_info(self):
        """Update stock info for all symbols."""
        print("\n")
        logger.info("######################### Step 2 - StockInfoManager initialized")

        try:
            # Create table if it doesn't exist
            await self.create_stock_info_table()
            
            # Check if table already has data
            if await self.has_stock_info_data():
                logger.warning("Stock info table already contains data. Aborting save operation.")
                return False

            # Get symbols from database
            symbols = await self.get_symbols_from_db()
            if not symbols:
                logger.error("No symbols found in database")
                return False

            # Process symbols in batches of 2500 (5 parallel calls of 500 symbols each)
            batch_size = 2500
            total_batches = (len(symbols) + batch_size - 1) // batch_size
            
            for i in range(0, len(symbols), batch_size):
                batch_start_time = datetime.now().timestamp()
                logger.info(f"Processing batch {i//batch_size + 1} of {total_batches}")

                batch = symbols[i:i + batch_size]
                await self.process_stock_info_batch(batch)
                
                batch_end_time = datetime.now().timestamp()
                batch_duration = batch_end_time - batch_start_time
                logger.info(f"Batch {i//batch_size + 1} took {batch_duration:.2f} seconds to complete")

                # Calculate sleep time based on API rate limits
                # We're making 5 parallel calls per batch, so we need to account for that
                total_reps = 750/5  # 5 parallel calls
                time_per_rep = 60/total_reps
                
                if i + batch_size < len(symbols) and (batch_duration < time_per_rep):
                    sleep_time = 1 + time_per_rep - batch_duration
                    logger.info(f"Sleeping for {sleep_time:.2f} seconds")
                    await asyncio.sleep(sleep_time)

            logger.info("Stock info update completed successfully")
            return True

        except Exception as e:
            logger.error(f"Error updating stock info: {str(e)}")
            raise

if __name__ == "__main__":
    stock_info_manager = StockInfoManager()
    asyncio.run(stock_info_manager.update_stock_info()) 