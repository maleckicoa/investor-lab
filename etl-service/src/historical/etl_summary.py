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
        """Update the etl_summary table with current data counts."""
        try:
            logger.info("Starting ETL summary update...")
            
            # Create table if it doesn't exist
            await self.create_etl_summary_table()
            
            # SQL query to get summary data
            summary_sql = """
            INSERT INTO raw.etl_summary (
    date,
    day,
    fx_cnt,
    close_cnt,
    vol_cnt,
    close_eur_cnt,
    close_usd_cnt,
    vol_eur_cnt,
    vol_usd_cnt,
    mcap_cnt,
    mcap_eur_cnt,
    mcap_usd_cnt
)
WITH recent_fx_dates AS (
  SELECT date
  FROM raw.historical_forex
  WHERE price IS NOT NULL AND price <> 0
  GROUP BY date
  ORDER BY date DESC
  LIMIT 10
),
fx AS (
  SELECT d.date,
         COUNT(DISTINCT hf.forex_pair) AS fx_cnt
  FROM recent_fx_dates d
  JOIN raw.historical_forex hf
    ON hf.date = d.date
  WHERE hf.price IS NOT NULL AND hf.price <> 0
  GROUP BY d.date
),
hpv_cnts AS (
  SELECT d.date,
         COUNT(DISTINCT symbol) FILTER (WHERE close       IS NOT NULL AND close       <> 0) AS close_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE volume      IS NOT NULL AND volume      <> 0) AS vol_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE close_eur   IS NOT NULL AND close_eur   <> 0) AS close_eur_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE close_usd   IS NOT NULL AND close_usd   <> 0) AS close_usd_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE volume_eur  IS NOT NULL AND volume_eur  <> 0) AS vol_eur_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE volume_usd  IS NOT NULL AND volume_usd  <> 0) AS vol_usd_cnt
  FROM raw.historical_price_volume hpv
  JOIN recent_fx_dates d ON hpv.date = d.date
  GROUP BY d.date
),
mcap_cnts AS (
  SELECT d.date,
         COUNT(DISTINCT symbol) FILTER (WHERE market_cap      IS NOT NULL AND market_cap      <> 0) AS mcap_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE market_cap_eur  IS NOT NULL AND market_cap_eur  <> 0) AS mcap_eur_cnt,
         COUNT(DISTINCT symbol) FILTER (WHERE market_cap_usd  IS NOT NULL AND market_cap_usd  <> 0) AS mcap_usd_cnt
  FROM raw.historical_market_cap mc
  JOIN recent_fx_dates d ON mc.date = d.date
  GROUP BY d.date
),
joined AS (
  SELECT
    COALESCE(fx.date, mc.date) AS date_key,
    fx.fx_cnt,
    hpv.close_cnt,
    hpv.vol_cnt,
    hpv.close_eur_cnt,
    hpv.close_usd_cnt,
    hpv.vol_eur_cnt,
    hpv.vol_usd_cnt,
    mc.mcap_cnt,
    mc.mcap_eur_cnt,
    mc.mcap_usd_cnt
  FROM fx
  FULL OUTER JOIN mcap_cnts mc USING (date)
  LEFT JOIN hpv_cnts hpv ON hpv.date = COALESCE(fx.date, mc.date)
)
SELECT
  date_key AS date,
  TO_CHAR(date_key, 'FMDay') AS day,
  fx_cnt,
  close_cnt,
  vol_cnt,
  close_eur_cnt,
  close_usd_cnt,
  vol_eur_cnt,
  vol_usd_cnt,
  mcap_cnt,
  mcap_eur_cnt,
  mcap_usd_cnt
FROM joined
ORDER BY date_key DESC
ON CONFLICT (date) DO UPDATE SET
  day           = EXCLUDED.day,
  fx_cnt        = EXCLUDED.fx_cnt,
  close_cnt     = EXCLUDED.close_cnt,
  vol_cnt       = EXCLUDED.vol_cnt,
  close_eur_cnt = EXCLUDED.close_eur_cnt,
  close_usd_cnt = EXCLUDED.close_usd_cnt,
  vol_eur_cnt   = EXCLUDED.vol_eur_cnt,
  vol_usd_cnt   = EXCLUDED.vol_usd_cnt,
  mcap_cnt      = EXCLUDED.mcap_cnt,
  mcap_eur_cnt  = EXCLUDED.mcap_eur_cnt,
  mcap_usd_cnt  = EXCLUDED.mcap_usd_cnt,
  created_at    = CURRENT_TIMESTAMP;
            """
            
            with self.engine.connect() as conn:
                result = conn.execute(text(summary_sql))
                conn.commit()
                logger.info("ETL summary table updated successfully")
                
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
