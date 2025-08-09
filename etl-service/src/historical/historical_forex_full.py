import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from ..utils.utils import get_logger, get_postgres_connection, get_database_url
from ..utils.models import ForexCleanValidator
import os

logger = get_logger(__name__)

class FullForexManager:
    def __init__(self):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
    
    async def create_forex_table(self):
        """Ensure clean schema and clean.historical_forex_full table exist."""
        try:
            with self.engine.connect() as conn:
                # Ensure schema exists
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS clean"))
                conn.commit()
                
                # Ensure table exists
                exists = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'clean' 
                          AND table_name = 'historical_forex_full'
                    )
                """)).scalar()
                if not exists:
                    conn.execute(text("""
                        CREATE TABLE clean.historical_forex_full (
                            date DATE,
                            forex_pair VARCHAR(20),
                            ccy_left VARCHAR(3),
                            ccy_right VARCHAR(3),
                            price NUMERIC(20, 6),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    conn.commit()
                    logger.info("Created table clean.historical_forex_full")
                else:
                    logger.info("Table clean.historical_forex_full exists")
        except Exception as e:
            logger.error(f"Error ensuring clean.historical_forex_full: {str(e)}")
            raise
    
    async def process_and_save(self):
        logger.info("Starting forex data processing...")
        
        # Ensure schema and table first
        await self.create_forex_table()
        
        df = pd.read_sql("SELECT date, forex_pair, price FROM raw.historical_forex", self.engine)
        
        if df.empty:
            logger.warning("No data found in raw.historical_forex table")
            return None
            
        logger.info(f"Read {len(df)} records from raw.historical_forex")
        
        df['date'] = pd.to_datetime(df['date'])
        all_dates = pd.date_range(df['date'].min(), df['date'].max())
        
        # Add EUREUR and USDUSD pairs for all dates, price = 1
        extra_pairs = ['EUREUR', 'USDUSD']
        # Create DataFrame for extra pairs
        extra_index = pd.MultiIndex.from_product([all_dates, extra_pairs], names=['date', 'forex_pair'])
        df_extra = pd.DataFrame(index=extra_index).reset_index()
        df_extra['price'] = 1.0
        # Concatenate with original df
        df = pd.concat([df, df_extra], ignore_index=True)

        pairs = df['forex_pair'].unique()
        logger.info(f"Processing {len(pairs)} forex pairs across {len(all_dates)} dates (including extra pairs)")
        full_index = pd.MultiIndex.from_product([all_dates, pairs], names=['date', 'forex_pair'])
        df_full = pd.DataFrame(index=full_index).reset_index()
        df_merged = df_full.merge(df, how='left', on=['date', 'forex_pair'])
        df_merged['price'] = df_merged.groupby('forex_pair')['price'].ffill()
        
        # Add ccy_left and ccy_right columns
        df_merged['ccy_left'] = df_merged['forex_pair'].str[:3]
        df_merged['ccy_right'] = df_merged['forex_pair'].str[-3:]
        
        # Remove rows with null prices (couldn't be forward-filled)
        df_merged = df_merged.dropna(subset=['price'])
        
        # Validate records before saving to clean schema
        validated_records = []
        validation_errors = 0
        
        for _, row in df_merged.iterrows():
            try:
                validated_record = ForexCleanValidator(
                    date=row['date'].date(),
                    forex_pair=row['forex_pair'],
                    price=float(row['price']),
                    ccy_left=row['ccy_left'],
                    ccy_right=row['ccy_right'],
                    created_at=row['created_at'] if 'created_at' in row and pd.notnull(row['created_at']) else datetime.now()
                )
                record_dict = validated_record.model_dump()
                validated_records.append(record_dict)
            except Exception as e:
                validation_errors += 1
                logger.warning(f"Validation failed for {row['forex_pair']} on {row['date']}: {e}")
        
        if validation_errors > 0:
            logger.warning(f"Validation failed for {validation_errors} records")
        
        if validated_records:
            df_validated = pd.DataFrame(validated_records)
            df_validated['date'] = pd.to_datetime(df_validated['date']).dt.date
            df_validated = df_validated[['date', 'forex_pair', 'ccy_left', 'ccy_right', 'price', 'created_at']]
            
            logger.info(f"historical_forex_full columns about to write: {list(df_validated.columns)}")

            df_validated.to_sql('historical_forex_full', self.engine, schema='clean', index=False, if_exists='replace')
            
            # Create index on date, ccy_left, ccy_right
            with self.engine.connect() as conn:
                conn.execute(text('CREATE INDEX IF NOT EXISTS idx_historical_forex_full_date_ccyleft_ccyright ON clean.historical_forex_full (date, ccy_left, ccy_right)'))
                conn.commit()
            logger.info(f"Successfully processed and validated {len(df_validated)} records, saved to clean.historical_forex_full")
            return df_validated
        else:
            logger.error("No valid records to save")
            return None

    async def run(self):
        print("\n")
        logger.info("######################### Step 2(4) - FullForexManager initialized")
        
        try:
            result = await self.process_and_save()
            return result is not None
        except Exception as e:
            logger.error(f"Error processing forex data: {str(e)}")
            raise

if __name__ == "__main__":
    manager = FullForexManager()
    manager.run()
