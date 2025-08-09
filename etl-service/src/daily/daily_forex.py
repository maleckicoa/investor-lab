import asyncio
from datetime import datetime, timedelta
from ..fmp_api import FMPAPI
from ..utils.utils import get_logger, get_postgres_connection
from ..utils.models import ForexRawValidator
from io import StringIO
from ..historical.historical_forex import HistoricalForexManager
from ..historical.historical_forex_full import FullForexManager

# Get logger
logger = get_logger(__name__)

class DailyForexManager:
    def __init__(self):
        self.logger = get_logger(__name__)
        # Set the last 7 days as the date range
        self.end_date = (datetime.now() - timedelta(days=1)).date()
        self.start_date = self.end_date - timedelta(days=6)
        self.historical_manager = HistoricalForexManager(start_date=self.start_date.strftime('%Y-%m-%d'))

    async def refresh_last_7_days(self):
        """Fetch forex data for the last 7 days, delete old values, and insert new ones."""
        print("\n")
        logger.info(f"######################### Step 1 - DailyForexManager initialized with start_date={self.start_date}, end_date={self.end_date}")

        try:
            # 1. Fetch all forex pairs using HistoricalForexManager's method
            pairs = await self.historical_manager.get_forex_pairs()
            if not pairs:
                self.logger.error("No forex pairs found for update.")
                return False

            # 2. Delete existing records for the last 7 days
            conn = get_postgres_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute("SET search_path TO raw")
                    cur.execute(
                        """
                        DELETE FROM historical_forex
                        WHERE date BETWEEN %s AND %s
                        """,
                        (self.start_date, self.end_date)
                    )
                    deleted = cur.rowcount
                    conn.commit()
                    self.logger.info(f"Deleted {deleted} records from raw.historical_forex for dates {self.start_date} to {self.end_date}")
            finally:
                conn.close()

            # 3. Fetch and process new data for the last 7 days
            # Patch the end_date on the manager to match our range
            self.historical_manager.end_date = self.end_date.strftime('%Y-%m-%d')
            await self.historical_manager.process_forex_batch(pairs)
            self.logger.info(f"Successfully refreshed forex data for {self.start_date} to {self.end_date}")
            return True
        except Exception as e:
            self.logger.error(f"Error refreshing last 7 days of forex data: {str(e)}")
            raise

if __name__ == "__main__":
    forex_manager = DailyForexManager() # Update Forex data
    asyncio.run(forex_manager.refresh_last_7_days())

    full_forex_manager = FullForexManager() # Clean and fill gaps for forex data
    asyncio.run(full_forex_manager.run())





    