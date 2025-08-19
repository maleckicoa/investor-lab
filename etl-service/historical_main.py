import asyncio
from src.historical.stock_symbols import StockSymbolsManager
from src.historical.historical_price_volume import HistoricalPriceVolumeManager, HistoricalPriceVolumeFxConverter
from src.historical.historical_market_cap import HistoricalMcapManager, HistoricalMcapFxConverter
from src.historical.historical_forex import HistoricalForexManager
from src.historical.historical_forex_full import FullForexManager
from src.historical.stock_info import StockInfoManager
from src.historical.stock_info_update import VolAvgManager, RelevanceManager
from src.historical.etl_summary import ETLSummaryManager
from src.metrics.stock_metrics import MetricsManager, PercentileCalculator
from src.utils.utils import get_logger, ensure_schemas_exist

# Get logger
logger = get_logger(__name__)

async def main():
    
    try:        
        
        # stock_manager = StockSymbolsManager() #Get and store stock symbols
        # await stock_manager.save_stock_symbols()
        
        # stock_info_manager = StockInfoManager() # Get and store stock info data
        # await stock_info_manager.update_stock_info()

        # forex_manager = HistoricalForexManager() # Then, get and store historical forex data
        # await forex_manager.save_historical_forex()

        # full_forex_manager = FullForexManager() # clean and fill gaps for forex data
        # await full_forex_manager.run()

        # vol_avg_manager = VolAvgManager() # Add stock info vol_avg columns in EUR and USD
        # await vol_avg_manager.run_update()

        # relevance_manager = RelevanceManager() # Update stock info relevance column
        # await relevance_manager.run_update()

        # price_manager = HistoricalPriceVolumeManager() # Then, get and store historical prices
        # await price_manager.save_historical_price_volume()

        # fx_converter = HistoricalPriceVolumeFxConverter() #Convert prices to EUR and USD
        # await fx_converter.run_conversion()

        # mcap_manager = HistoricalMcapManager() # Get and store historical market cap data
        # await mcap_manager.save_historical_market_cap()

        # mcap_fx_converter = HistoricalMcapFxConverter()  # Convert market cap to EUR and USD
        # await mcap_fx_converter.run_conversion()

        # etl_summary_manager = ETLSummaryManager() # Update ETL Summary data
        # await etl_summary_manager.run_update()

        #metrics_manager = MetricsManager() # Get and store financial metrics data
        #await metrics_manager.save_financial_metrics()

        percentile_calculator = PercentileCalculator()
        percentile_calculator.run_percentile_calculation()



        logger.info(f"\n\n✅ Historical data ETL done\n\n\n\n\n")

    except Exception as e:
        logger.error(f"❌ Error during ETL process: {str(e)}")
        raise

if __name__ == "__main__":
    ensure_schemas_exist()
    asyncio.run(main())