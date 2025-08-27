
import asyncio
from sqlalchemy import create_engine, text
from ..utils.utils import get_database_url, get_logger

# Get logger
logger = get_logger(__name__)

class IndexManager:
    """
    Manages database indexes for optimal query performance.
    Creates indexes concurrently to avoid blocking operations.
    """
    
    def __init__(self):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        
        # Define all index creation SQL statements
        self.indexes = {
            "idx_stock_info_country": """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_info_country
                ON raw.stock_info (country);
            """,
            
            "idx_fmp_symbol_year_quarter": """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fmp_symbol_year_quarter
                ON clean.financial_metrics_perc (symbol, fiscal_year, period);
            """,
            
            "idx_hpv_symbol_year_quarter": """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hpv_symbol_year_quarter
                ON raw.historical_price_volume (symbol, year, quarter);
            """,
            
            "idx_hpv_volume_eur": """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hpv_volume_eur
                ON raw.historical_price_volume (volume_eur);
            """,
            
            "idx_hmc_lqd_symbol_year_quarter": """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hmc_lqd_symbol_year_quarter
                ON raw.historical_market_cap (symbol, year, quarter)
                WHERE last_quarter_date = TRUE;
            """
        }
    
    async def create_all_indexes(self) -> None:
        """Create all defined indexes concurrently."""
        print("\n")
        logger.info("######################### Step 13 - IndexManager initialized")
        try:
            logger.info("Starting index creation process...")
            
            for index_name, sql in self.indexes.items():
                try:
                    logger.info(f"Creating index: {index_name}")
                    with self.engine.connect() as conn:
                        conn.execute(text(sql))
                        conn.commit()
                    logger.info(f"Successfully created index: {index_name}")
                    
                except Exception as e:
                    logger.error(f"Error creating index {index_name}: {str(e)}")
                    # Continue with other indexes even if one fails
                    continue
            
            logger.info("Index creation process completed")
            
        except Exception as e:
            logger.error(f"Error in index creation process: {str(e)}")
            raise
    
    # async def create_specific_index(self, index_name: str) -> bool:
    #     """Create a specific index by name."""
    #     try:
    #         if index_name not in self.indexes:
    #             logger.error(f"Index '{index_name}' not found in defined indexes")
    #             return False
            
    #         logger.info(f"Creating specific index: {index_name}")
    #         with self.engine.connect() as conn:
    #             conn.execute(text(self.indexes[index_name]))
    #             conn.commit()
    #         logger.info(f"Successfully created index: {index_name}")
    #         return True
            
    #     except Exception as e:
    #         logger.error(f"Error creating index {index_name}: {str(e)}")
    #         return False
    
    # def get_index_sql(self, index_name: str) -> str:
    #     """Get the SQL statement for a specific index."""
    #     return self.indexes.get(index_name, "")


if __name__ == "__main__":
    index_manager = IndexManager()
    asyncio.run(index_manager.create_all_indexes())