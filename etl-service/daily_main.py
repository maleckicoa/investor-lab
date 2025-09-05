import asyncio
import sys
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from src.daily.daily_price_volume import DailyPriceVolumeManager, DailyPriceVolumeFxConverter
from src.daily.daily_market_cap import DailyMcapManager, DailyMcapFxConverter
from src.daily.daily_forex import DailyForexManager
from src.historical.historical_forex_full import FullForexManager
from src.historical.etl_summary import ETLSummaryManager
from src.benchmarks.benchmarks import BenchmarkManager, BenchmarkFxConverter
from src.utils.utils import get_logger

logger = get_logger(__name__)

async def run_etl_job():
    """Main function to update daily prices and forex data."""
    try:
        logger.info(f"🚀 Starting daily ETL process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        
        # forex_manager = DailyForexManager() # Update Forex data
        # await forex_manager.refresh_last_7_days()

        # full_forex_manager = FullForexManager() # Clean and fill gaps for forex data
        # await full_forex_manager.run()

        # price_manager = DailyPriceVolumeManager()  # Update Price and Volume data
        # await price_manager.run_daily_update()

        # price_volume_fx_converter = DailyPriceVolumeFxConverter() # Convert Prices and Volumes to EUR and USD
        # await price_volume_fx_converter.run_daily_fx_conversion()

        # mcap_manager = DailyMcapManager() # Update Market Cap data
        # await mcap_manager.run_daily_update()

        # mcap_fx_converter = DailyMcapFxConverter() # Convert Market Cap to EUR and USD
        # await mcap_fx_converter.run_daily_fx_conversion()

        benchmark_manager = BenchmarkManager() # Get and store benchmark data
        await benchmark_manager.run()

        benchmark_fx_converter = BenchmarkFxConverter() # Convert benchmark data to EUR and USD
        benchmark_fx_converter.convert()

        etl_summary_manager = ETLSummaryManager() # Update ETL Summary data
        await etl_summary_manager.run_update()

        logger.info(f"\n\n✅ Daily data ETL done \n\n\n\n\n")

    except Exception as e:
        logger.error(f"❌ Error during ETL process: {str(e)}")
        logger.exception("Full traceback:")
        raise

async def main():
    """Main function that sets up the scheduler or runs immediately."""
    
    # Check if we should run immediately (for testing) or start scheduler
    if len(sys.argv) > 1 and sys.argv[1] == "--run-now":
        logger.info("🧪 Running ETL process immediately...")
        await run_etl_job()
        return
    
    # Set up the scheduler
    scheduler = AsyncIOScheduler()
    
   
    scheduler.add_job(
        run_etl_job,
        CronTrigger(hour=3, minute=0), # Schedule the job to run daily at 3am
        id='daily_etl_job',
        name='Daily ETL Process',
        replace_existing=True
    )
    
    logger.info("🕐 Daily ETL Scheduler started")
    logger.info("📋 Schedule: Every day at 03:00")
    logger.info("⏳ Waiting for scheduled time...")
    logger.info("💡 Use Ctrl+C to stop the scheduler")
    
    # Start the scheduler
    scheduler.start()
    
    try:
        # Keep the event loop running
        while True:
            await asyncio.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("🛑 Scheduler stopped by user")
        scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(main()) 