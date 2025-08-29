import asyncio
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime
from ..utils.utils import get_database_url, get_logger

# Get logger
logger = get_logger(__name__)

# Load environment variables
load_dotenv()

class ETLSummaryManager:
    """
    Creates and updates the etl_summary table with data counts from various tables.
    """
    def __init__(self):
        """Initialize the ETLSummaryManager with database connection."""
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)

    async def create_etl_summary_table(self):
        """Create the etl_summary table if it doesn't exist."""
        try:
            with self.engine.connect() as conn:
                # Create raw schema if it doesn't exist
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
                conn.commit()
                
                # Check if table exists
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'raw' 
                        AND table_name = 'etl_summary'
                    )
                """)).scalar()
                
                if not result:
                    logger.info("Creating ETL summary table in raw schema...")
                
                # Create etl_summary table with date as primary key for upsert functionality
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS raw.etl_summary (
                        date DATE PRIMARY KEY,
                        day VARCHAR(10),
                        fx_cnt INTEGER,
                        close_cnt INTEGER,
                        vol_cnt INTEGER,
                        close_eur_cnt INTEGER,
                        close_usd_cnt INTEGER,
                        vol_eur_cnt INTEGER,
                        vol_usd_cnt INTEGER,
                        mcap_cnt INTEGER,
                        mcap_eur_cnt INTEGER,
                        mcap_usd_cnt INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.commit()
                logger.info("ETL summary table created/verified in raw schema")
                
        except Exception as e:
            logger.error(f"Error creating ETL summary table: {str(e)}")
            raise

    async def update_etl_summary(self):
        """Update the ETL summary table by dropping and recreating it with fresh data."""
        try:
            logger.info("Starting ETL summary update...")
            
            # Drop and recreate the table completely
            with self.engine.connect() as conn:
                # Drop existing table
                conn.execute(text("DROP TABLE IF EXISTS raw.etl_summary"))
                conn.commit()
                logger.info("Dropped existing ETL summary table")
                
                # Create fresh table
                await self.create_etl_summary_table()
                
                # Insert fresh data with the new query
                summary_sql = """
                WITH forex AS (
                    SELECT 
                        date, 
                        COUNT(price) AS fx_cnt
                    FROM clean.historical_forex_full 
                    WHERE date >= CURRENT_DATE - INTERVAL '10 days'
                    AND price IS NOT NULL AND price <> 0
                    GROUP BY date
                    ORDER BY date DESC
                    LIMIT 10
                ),
                price AS (
                    SELECT 
                        date, 
                        COUNT(close)      AS close_cnt,
                        COUNT(close_eur)  AS close_eur_cnt, 
                        COUNT(close_usd)  AS close_usd_cnt
                    FROM raw.historical_price_volume 
                    WHERE date >= CURRENT_DATE - INTERVAL '10 days'
                    AND close IS NOT NULL AND close <> 0
                    GROUP BY date
                    ORDER BY date DESC
                    LIMIT 10
                ),
                volume AS (
                    SELECT 
                        date, 
                        COUNT(volume)      AS vol_cnt,
                        COUNT(volume_eur)  AS vol_eur_cnt, 
                        COUNT(volume_usd)  AS vol_usd_cnt
                    FROM raw.historical_price_volume 
                    WHERE date >= CURRENT_DATE - INTERVAL '10 days'
                    AND volume IS NOT NULL AND volume <> 0
                    GROUP BY date
                    ORDER BY date DESC
                    LIMIT 10
                ),
                mcap AS (
                    SELECT 
                        date, 
                        COUNT(market_cap)      AS mcap_cnt,
                        COUNT(market_cap_eur)  AS mcap_eur_cnt, 
                        COUNT(market_cap_usd)  AS mcap_usd_cnt
                    FROM raw.historical_market_cap 
                    WHERE date >= CURRENT_DATE - INTERVAL '10 days'
                    AND market_cap IS NOT NULL AND market_cap <> 0
                    GROUP BY date
                    ORDER BY date DESC
                    LIMIT 10
                )
                INSERT INTO raw.etl_summary (
                    date, day, fx_cnt, close_cnt, close_eur_cnt, close_usd_cnt,
                    vol_cnt, vol_eur_cnt, vol_usd_cnt, mcap_cnt, mcap_eur_cnt, mcap_usd_cnt, created_at
                )
                SELECT 
                    COALESCE(f.date, p.date, v.date, m.date) AS date,
                    TO_CHAR(COALESCE(f.date, p.date, v.date, m.date), 'FMDay') AS day,
                    f.fx_cnt,
                    p.close_cnt, p.close_eur_cnt, p.close_usd_cnt,
                    v.vol_cnt, v.vol_eur_cnt, v.vol_usd_cnt,
                    m.mcap_cnt, m.mcap_eur_cnt, m.mcap_usd_cnt,
                    CURRENT_TIMESTAMP AS created_at
                FROM forex f
                FULL OUTER JOIN price  p ON f.date = p.date
                FULL OUTER JOIN volume v ON COALESCE(f.date, p.date) = v.date
                FULL OUTER JOIN mcap   m ON COALESCE(f.date, p.date, v.date) = m.date
                ORDER BY date DESC;
                """
                
                result = conn.execute(text(summary_sql))
                conn.commit()
                logger.info("ETL summary table updated successfully with fresh data")
                
        except Exception as e:
            logger.error(f"Error updating ETL summary: {str(e)}")
            raise

    async def run_update(self):
        """Main method to run the ETL summary update process."""

        print("\n")
        logger.info("######################### Step 7 (14) - ETLSummaryManager initialized")

        try:
            logger.info("Starting ETL summary process...")
            await self.update_etl_summary()
            logger.info("ETL summary process completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error in ETL summary process: {str(e)}")
            raise


if __name__ == "__main__":
    etl_summary_manager = ETLSummaryManager()
    asyncio.run(etl_summary_manager.run_update())
