
import random
import asyncio
import numpy as np
import pandas as pd
import polars as pl
from dotenv import load_dotenv
from typing import Dict, List, Optional
from collections import OrderedDict
from datetime import datetime, timedelta

import io
from io import StringIO
import psycopg2
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from src.fmp_api import FMPAPI
from src.utils.utils import get_postgres_connection, get_database_url, get_logger
from src.utils.models import FinancialRatiosValidator


# Get logger
logger = get_logger(__name__)
load_dotenv()

field_mapping = OrderedDict([
     # Basic Info
    ('symbol', 'symbol'),
    ('date', 'date'),
    ('fiscalYear', 'fiscal_year'),
    ('period', 'period'),
    ('reportedCurrency', 'reported_currency'),
     # Profitability Ratios
    ('grossProfitMargin', 'gross_profit_margin'),
    ('ebitMargin', 'ebit_margin'),
    ('ebitdaMargin', 'ebitda_margin'),
    ('operatingProfitMargin', 'operating_profit_margin'),
    ('pretaxProfitMargin', 'pretax_profit_margin'),
    ('continuousOperationsProfitMargin', 'continuous_operations_profit_margin'),
    ('netProfitMargin', 'net_profit_margin'),
    ('bottomLineProfitMargin', 'bottom_line_profit_margin'),
     # Liquidity Ratios
    ('currentRatio', 'current_ratio'),
    ('quickRatio', 'quick_ratio'),
    ('solvencyRatio', 'solvency_ratio'),
    ('cashRatio', 'cash_ratio'),
     # Efficiency Ratios
    ('receivablesTurnover', 'receivables_turnover'),
    ('payablesTurnover', 'payables_turnover'),
    ('inventoryTurnover', 'inventory_turnover'),
    ('fixedAssetTurnover', 'fixed_asset_turnover'),
    ('assetTurnover', 'asset_turnover'),
    ('workingCapitalTurnoverRatio', 'working_capital_turnover_ratio'),
     # Valuation Ratios
    ('priceToEarningsRatio', 'price_to_earnings_ratio'),
    ('priceToEarningsGrowthRatio', 'price_to_earnings_growth_ratio'),
    ('forwardPriceToEarningsGrowthRatio', 'forward_price_to_earnings_growth_ratio'),
    ('priceToBookRatio', 'price_to_book_ratio'),
    ('priceToSalesRatio', 'price_to_sales_ratio'),
    ('priceToFreeCashFlowRatio', 'price_to_free_cash_flow_ratio'),
    ('priceToOperatingCashFlowRatio', 'price_to_operating_cash_flow_ratio'),
    ('priceToFairValue', 'price_to_fair_value'),
    # Leverage Ratios 
    ('debtToAssetsRatio', 'debt_to_assets_ratio'),
    ('debtToEquityRatio', 'debt_to_equity_ratio'),
    ('debtToCapitalRatio', 'debt_to_capital_ratio'),
    ('longTermDebtToCapitalRatio', 'long_term_debt_to_capital_ratio'),
    ('financialLeverageRatio', 'financial_leverage_ratio'),
    ('debtToMarketCap', 'debt_to_market_cap'),
    #  Cash Flow Ratios
    ('operatingCashFlowRatio', 'operating_cash_flow_ratio'),
    ('operatingCashFlowSalesRatio', 'operating_cash_flow_sales_ratio'),
    ('freeCashFlowOperatingCashFlowRatio', 'free_cash_flow_operating_cash_flow_ratio'),
    ('debtServiceCoverageRatio', 'debt_service_coverage_ratio'),
    ('interestCoverageRatio', 'interest_coverage_ratio'),
    ('shortTermOperatingCashFlowCoverageRatio', 'short_term_operating_cash_flow_coverage_ratio'),
    ('operatingCashFlowCoverageRatio', 'operating_cash_flow_coverage_ratio'),
    ('capitalExpenditureCoverageRatio', 'capital_expenditure_coverage_ratio'),
    ('dividendPaidAndCapexCoverageRatio', 'dividend_paid_and_capex_coverage_ratio'),
    # Dividend ratios
    ('dividendPayoutRatio', 'dividend_payout_ratio'),
    ('dividendYield', 'dividend_yield'),
    ('dividendYieldPercentage', 'dividend_yield_percentage'),
    ('dividendPerShare', 'dividend_per_share'),
    # Per Share metrics
    ('revenuePerShare', 'revenue_per_share'),
    ('netIncomePerShare', 'net_income_per_share'),
    ('interestDebtPerShare', 'interest_debt_per_share'),
    ('cashPerShare', 'cash_per_share'),
    ('bookValuePerShare', 'book_value_per_share'),
    ('tangibleBookValuePerShare', 'tangible_book_value_per_share'),
    ('shareholdersEquityPerShare', 'shareholders_equity_per_share'),
    ('operatingCashFlowPerShare', 'operating_cash_flow_per_share'),
    ('capexPerShare', 'capex_per_share'),
    ('freeCashFlowPerShare', 'free_cash_flow_per_share'),
    # Additional ratios
    ('netIncomePerEBT', 'net_income_per_ebt'),
    ('ebtPerEbit', 'ebt_per_ebit'),
    ('effectiveTaxRate', 'effective_tax_rate'),
    ('enterpriseValueMultiple', 'enterprise_value_multiple')
])


def get_create_table_sql(schema: str, table_name: str) -> str:
    return f"""
        CREATE TABLE IF NOT EXISTS {schema}.{table_name} (
            symbol VARCHAR(20),
            date DATE,
            fiscal_year VARCHAR(10),
            period VARCHAR(10),
            reported_currency VARCHAR(10),
            
            -- Profitability Ratios
            gross_profit_margin NUMERIC(30, 6),
            ebit_margin NUMERIC(30, 6),
            ebitda_margin NUMERIC(30, 6),
            operating_profit_margin NUMERIC(30, 6),
            pretax_profit_margin NUMERIC(30, 6),
            continuous_operations_profit_margin NUMERIC(30, 6),
            net_profit_margin NUMERIC(30, 6),
            bottom_line_profit_margin NUMERIC(30, 6),
            
            -- Liquidity Ratios
            current_ratio NUMERIC(30, 6),
            quick_ratio NUMERIC(30, 6),
            solvency_ratio NUMERIC(30, 6),
            cash_ratio NUMERIC(30, 6),
            
            -- Efficiency Ratios
            receivables_turnover NUMERIC(30, 6),
            payables_turnover NUMERIC(30, 6),
            inventory_turnover NUMERIC(30, 6),
            fixed_asset_turnover NUMERIC(30, 6),
            asset_turnover NUMERIC(30, 6),
            working_capital_turnover_ratio NUMERIC(30, 6),
            
            -- Valuation Ratios
            price_to_earnings_ratio NUMERIC(30, 6),
            price_to_earnings_growth_ratio NUMERIC(30, 6),
            forward_price_to_earnings_growth_ratio NUMERIC(30, 6),
            price_to_book_ratio NUMERIC(30, 6),
            price_to_sales_ratio NUMERIC(30, 6),
            price_to_free_cash_flow_ratio NUMERIC(30, 6),
            price_to_operating_cash_flow_ratio NUMERIC(30, 6),
            price_to_fair_value NUMERIC(30, 6),
            
            -- Leverage Ratios
            debt_to_assets_ratio NUMERIC(30, 6),
            debt_to_equity_ratio NUMERIC(30, 6),
            debt_to_capital_ratio NUMERIC(30, 6),
            long_term_debt_to_capital_ratio NUMERIC(30, 6),
            financial_leverage_ratio NUMERIC(30, 6),
            debt_to_market_cap NUMERIC(30, 6),
            
            -- Cash Flow Ratios
            operating_cash_flow_ratio NUMERIC(30, 6),
            operating_cash_flow_sales_ratio NUMERIC(30, 6),
            free_cash_flow_operating_cash_flow_ratio NUMERIC(30, 6),
            debt_service_coverage_ratio NUMERIC(30, 6),
            interest_coverage_ratio NUMERIC(30, 6),
            short_term_operating_cash_flow_coverage_ratio NUMERIC(30, 6),
            operating_cash_flow_coverage_ratio NUMERIC(30, 6),
            capital_expenditure_coverage_ratio NUMERIC(30, 6),
            dividend_paid_and_capex_coverage_ratio NUMERIC(30, 6),
            
            -- Dividend Ratios
            dividend_payout_ratio NUMERIC(30, 6),
            dividend_yield NUMERIC(30, 6),
            dividend_yield_percentage NUMERIC(30, 6),
            dividend_per_share NUMERIC(30, 6),
            
            -- Per Share Metrics
            revenue_per_share NUMERIC(30, 6),
            net_income_per_share NUMERIC(30, 6),
            interest_debt_per_share NUMERIC(30, 6),
            cash_per_share NUMERIC(30, 6),
            book_value_per_share NUMERIC(30, 6),
            tangible_book_value_per_share NUMERIC(30, 6),
            shareholders_equity_per_share NUMERIC(30, 6),
            operating_cash_flow_per_share NUMERIC(30, 6),
            capex_per_share NUMERIC(30, 6),
            free_cash_flow_per_share NUMERIC(30, 6),
            
            -- Additional Ratios
            net_income_per_ebt NUMERIC(30, 6),
            ebt_per_ebit NUMERIC(30, 6),
            effective_tax_rate NUMERIC(30, 6),
            enterprise_value_multiple NUMERIC(30, 6),
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            PRIMARY KEY (symbol, date, period)
        )
    """

########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
class MetricsManager:
    def __init__(self, max_symbols: int = 50000):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()
        self.max_symbols = max_symbols

    def create_metrics_table(self):
        """Create the financial metrics tables in raw and stage schemas."""
        try:
            with self.engine.connect() as conn:
                # Drop table to ensure a clean slate
                conn.execute(text("DROP TABLE IF EXISTS raw.financial_metrics"))
                conn.commit()
                logger.info("Dropped financial_metrics table")
                
                logger.info("Creating fresh financial metrics tables...")
                
                # Create the main table in raw schema
                conn.execute(text(get_create_table_sql('raw', 'financial_metrics')))

                # Create the stage table
                conn.execute(text(get_create_table_sql('stage', 'financial_metrics_stage')))

                conn.commit()
                logger.info("Financial metrics tables created in raw and stage schemas.")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise

    # Index management removed - no indexes needed for simple data writing

    def get_symbols_from_db(self):
        """Get relevant stock symbols from the historical_price_volume table."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT DISTINCT symbol, currency 
                FROM raw.historical_price_volume
            """))
            symbols = [(row[0], row[1]) for row in result]
            logger.info(f"Found {len(symbols)} relevant symbols in historical_price_volume table")
            return symbols



    def _map_api_field_to_db(self, api_data: Dict, field_mapping: Dict[str, str]) -> Dict:
        """Map API response fields to database column names."""
        mapped_data = {}
        for api_field, db_field in field_mapping.items():
            if api_field in api_data:
                value = api_data[api_field]
                # Handle None values and convert to appropriate format
                if value is not None:
                    if isinstance(value, (int, float)):
                        # Handle extremely large or small numbers
                        if abs(value) > 1e20:  # Very large numbers (more conservative)
                            mapped_data[db_field] = None
                        elif abs(value) < 1e-10 and value != 0:  # Very small numbers
                            mapped_data[db_field] = None
                        elif value == float('inf') or value == float('-inf'):
                            mapped_data[db_field] = None
                        else:
                            mapped_data[db_field] = value
                    else:
                        mapped_data[db_field] = str(value)
                else:
                    mapped_data[db_field] = None
        return mapped_data


    async def process_metrics_batch(self, symbols_with_currency: list):
        """Process a batch of symbols to fetch and store financial metrics."""
        try:
            symbols = [s[0] for s in symbols_with_currency]
            currency_map = {s[0]: s[1] for s in symbols_with_currency}
            
            # Fetch financial ratios for all symbols in the batch
            tasks = [self.fmp.get_financial_ratios(symbol, "quarterly", 50) for symbol in symbols]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            all_data = []
            logger.info(f"Processing {len(symbols)} symbols...")
            
            for symbol, res in zip(symbols, results):
                if isinstance(res, Exception) or not res:
                    logger.warning(f"Failed to fetch metrics for {symbol}: {res}")
                    continue
                
                #logger.info(f"Processing {symbol}: got {len(res) if isinstance(res, list) else 0} records")
                
                # Process each ratio record for the symbol
                for ratio_data in res:
                    try:
                        # Map API fields to database columns
                        
                        
                        mapped_data = self._map_api_field_to_db(ratio_data, field_mapping)
                        
                        # Ensure required fields are present
                        if 'date' not in mapped_data or 'symbol' not in mapped_data:
                            continue
                            
                        # Convert date string to datetime if needed
                        if isinstance(mapped_data['date'], str):
                            try:
                                mapped_data['date'] = datetime.strptime(mapped_data['date'], "%Y-%m-%d")
                            except ValueError:
                                continue
                        
                        # Validate the data using Pydantic model
                        validated = FinancialRatiosValidator(**mapped_data)
                        all_data.append(validated.model_dump())
                        
                    except Exception as e:
                        logger.warning(f"Error processing ratio data for {symbol}: {e}")
                        continue

            logger.info(f"Total valid records collected: {len(all_data)}")
            
            if not all_data:
                logger.warning("No valid metrics data to process")
                return

            # Prepare data for bulk insert
            buffer = StringIO()
            for record in all_data:
                try:
                    # Format the data for COPY command
                    line_parts = [
                        str(record.get(db_field, '')) for db_field in field_mapping.values()
                    ]
                    
                    # Replace None values and handle empty strings for COPY
                    processed_parts = []
                    for part in line_parts:
                        if part == 'None' or part == '':
                            processed_parts.append('\\N')  # Use PostgreSQL NULL
                        else:
                            processed_parts.append(part)
                    buffer.write('\t'.join(processed_parts) + '\n')
                    
                except Exception as e:
                    logger.warning(f"Error formatting record for COPY: {e}")
                    continue

            buffer.seek(0)

            # Use COPY command for efficient bulk insert
            conn = get_postgres_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute("SET search_path TO stage")
                    
                    logger.info(f"Copying {len(all_data)} records to stage table...")
                    
                    # Copy to stage table
                    columns = list(field_mapping.values())
                    cur.copy_from(buffer, "financial_metrics_stage", columns=columns)

                    # Simple insert from stage to main table (no duplicate checks)
                    fields = ', '.join(field_mapping.values())
                    cur.execute(f"""
                        INSERT INTO raw.financial_metrics (
                            {fields}
                        )
                        SELECT 
                            {fields}
                        FROM stage.financial_metrics_stage
                    """)

                    # Clear stage table
                    cur.execute("TRUNCATE stage.financial_metrics_stage")
                    conn.commit()
                    
                    logger.info(f"Successfully processed {len(all_data)} metrics records")
                    
                    # Verify data was inserted
                    cur.execute("SELECT COUNT(*) FROM raw.financial_metrics")
                    count = cur.fetchone()[0]
                    logger.info(f"Total records in raw.financial_metrics table: {count}")
                    
            finally:
                conn.close()

        except Exception as e:
            logger.error(f"Error in process_metrics_batch: {e}", exc_info=True)

    def get_missing_symbols(self, symbols_with_currency):
        """Get symbols that are missing from the financial metrics table."""
        conn = get_postgres_connection()
        try:
            with conn.cursor() as cur:
                # Get distinct symbols that already exist in the table
                cur.execute("SELECT DISTINCT symbol FROM raw.financial_metrics")
                present = set(r[0] for r in cur.fetchall())
                
                # Return symbols that are NOT in the present set
                missing_symbols = [s for s in symbols_with_currency if s[0] not in present]
                logger.info(f"Found {len(present)} symbols with data, {len(missing_symbols)} symbols missing")
                
        finally:
            conn.close()
            
        return missing_symbols



    async def save_financial_metrics(self):
        """Main method to fetch and store financial metrics for all relevant stocks."""
        print("\n")
        logger.info(f"######################### Step 11 - MetricsManager initialized with max_symbols={self.max_symbols}")

        self.create_metrics_table()

        symbols_with_currency = self.get_symbols_from_db()
        if not symbols_with_currency:
            logger.error("No symbols found in database.")
            return False

        # Randomly sample symbols to avoid hitting API limits
        symbols_to_process = random.sample(symbols_with_currency, min(self.max_symbols, len(symbols_with_currency)))
        logger.info(f"Selected {len(symbols_to_process)} symbols for metrics processing.")

        batch_size = 250  # Increased batch size as requested
        total_reps = 750 / batch_size
        time_per_rep = 60 / total_reps

        max_retries = 7  # Implement 7 retries as requested
        attempt = 1
        
        while attempt <= max_retries and symbols_to_process:
            logger.info(f"Download attempt {attempt} for {len(symbols_to_process)} symbols")
            
            # Process symbols in batches
            total_batches = (len(symbols_to_process) + batch_size - 1) // batch_size
            
            for i in range(0, len(symbols_to_process), batch_size):
                batch = symbols_to_process[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1}/{total_batches} (attempt {attempt})")

                start_time = datetime.now().timestamp()
                await self.process_metrics_batch(batch)
                end_time = datetime.now().timestamp()
                duration = end_time - start_time

                logger.info(f"Batch {i//batch_size + 1} took {duration:.2f}s")

                # Dynamic sleep time based on duration as requested
                if i + batch_size < len(symbols_to_process) and duration < time_per_rep:
                    sleep_time = 7 + time_per_rep - duration
                    logger.info(f"Sleeping for {sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)

            # Check for missing symbols and update symbols_to_process for next attempt
            missing = self.get_missing_symbols(symbols_to_process)
            if not missing:
                logger.info("All symbols processed successfully.")
                break

            logger.warning(f"{len(missing)} symbols missing after attempt {attempt}. Retrying...")
            # Update symbols_to_process to only include missing symbols for next attempt
            symbols_to_process = missing
            attempt += 1

        if symbols_to_process:
            logger.error(f"Failed to download {len(symbols_to_process)} symbols after {max_retries} attempts.")
        
        logger.info("Financial metrics ingestion complete.")
        return True


########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################
########################################################################################


class PercentileCalculator:

    DATABASE_URL = get_database_url()
    engine: Engine = create_engine(DATABASE_URL)
    target_table = "clean.financial_metrics_perc"
    staging_schema = "stage"
    BATCH_SIZE = 4

    def __init__(self):
        self.identity_columns = ["symbol", "date", "fiscal_year", "period", "reported_currency"]
        self.percentile_levels = [0.01, 0.10, 0.20, 0.30, 0.40, 0.50,0.60, 0.70, 0.80, 0.90, 0.99]
        self.labels = ["<1%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "99%", ">99%"]
        self.metrics = [m for m in field_mapping.values() if m not in self.identity_columns]
        self.perc_values = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99, 100]

    def read_financial_metrics(self) -> pl.DataFrame:
        conn = get_postgres_connection()
        cur = conn.cursor()
        buf = io.BytesIO()
        cur.copy_expert("COPY raw.financial_metrics TO STDOUT WITH CSV HEADER", buf)
        buf.seek(0)
        df = pl.read_csv(buf, infer_schema_length=10000)
        cur.close()
        conn.close()
        return df.with_columns([
            pl.col("symbol").cast(pl.Utf8),
            pl.col("date").str.strptime(pl.Date, strict=False),
            pl.col("fiscal_year").cast(pl.Int64),
            pl.col("period").cast(pl.Utf8),
            pl.col("reported_currency").cast(pl.Utf8),
        ])

    def bucketize_metric(self, df: pl.DataFrame, metric: str) -> pl.DataFrame:
        non_null = df.select(self.identity_columns + [metric]).filter(pl.col(metric).is_not_null())
        if non_null.height == 0:
            return pl.DataFrame({"symbol": [], "date": [], f"{metric}_bound": [], f"{metric}_perc": []})
        qs = non_null.select([
            pl.col(metric).quantile(q, "nearest").alias(f"p{int(q*100):02d}")
            for q in self.percentile_levels
        ]).row(0)
        bins = [-np.inf] + list(qs) + [np.inf]
        lows, highs = bins[:-1], bins[1:]


        def fmt(x): return "-∞" if x == float("-inf") else "+∞" if x == float("inf") else f"{x:.2f}"
        bracket_display = [f"{lab} ({fmt(lo)} – {fmt(hi)})" for lab, lo, hi in zip(self.labels, lows, highs)]
        mapping_df = pl.DataFrame({"_low": lows, "_high": highs, "_label": bracket_display, "_perc": self.perc_values})

        return (
            non_null.lazy()
            .join(mapping_df.lazy(), how="cross")
            .filter((pl.col(metric) >= pl.col("_low")) & (pl.col(metric) < pl.col("_high")))
            .select(["symbol", "date", pl.col("_label").alias(f"{metric}_bound"), pl.col("_perc").alias(f"{metric}_perc")])
            .collect()
        )

    def run_percentile_calculation(self):
        print("\n")
        logger.info("######################### Step 12 - PercentileCalculator initialized")
        with self.engine.connect() as conn:
            # Drop table to ensure a clean slate
            conn.execute(text("DROP TABLE IF EXISTS clean.financial_metrics_perc"))
            conn.commit()
            logger.info("Dropped financial_metrics_perc table")
        logger.info("Reading raw.financial_metrics")
        df_raw = self.read_financial_metrics()
        df_base = df_raw.select(self.identity_columns).unique()

        logger.info("Dropping + recreating target table")
        with self.engine.begin() as conn:
            conn.execute(text(f"DROP TABLE IF EXISTS {self.target_table}"))
            ddl = f"""
                CREATE TABLE {self.target_table} (
                    symbol TEXT,
                    date DATE,
                    fiscal_year INTEGER,
                    period TEXT,
                    reported_currency TEXT
                ) WITH (fillfactor=100);
            """
            conn.execute(text(ddl))

        # Insert identities once
        pg_conn = psycopg2.connect(self.DATABASE_URL.replace("postgresql+psycopg2", "postgresql"))
        cur = pg_conn.cursor()
        buf = io.StringIO()
        df_base.to_pandas().to_csv(buf, sep="\t", index=False, header=False, na_rep="\\N")
        buf.seek(0)
        cols_sql = ", ".join([f'"{c}"' for c in self.identity_columns])
        cur.copy_expert(
            f"COPY {self.target_table} ({cols_sql}) FROM STDIN WITH (FORMAT text, DELIMITER E'\t', NULL '\\N')", buf
        )
        pg_conn.commit()

        # Process metrics in batches
        for i in range(0, len(self.metrics), self.BATCH_SIZE):
            batch = self.metrics[i:i + self.BATCH_SIZE]
            logger.info(f"Processing batch {i // self.BATCH_SIZE + 1}: {batch}")
            batch_df = df_base

            for m in batch:
                df_m = self.bucketize_metric(df_raw, m)
                if df_m.height > 0:
                    batch_df = batch_df.join(df_m, on=["symbol", "date"], how="left")

            pdf = batch_df.to_pandas()
            pdf["date"] = pd.to_datetime(pdf["date"]).dt.date
            
            # Ensure _perc columns are integers
            for m in batch:
                pdf[f"{m}_perc"] = pdf[f"{m}_perc"].astype('Int64')

            # Create staging table
            staging = f"{self.staging_schema}.tmp_batch_{i}"
            cur.execute(f"DROP TABLE IF EXISTS {staging}")
            cur.execute(f'CREATE TABLE {staging} (symbol TEXT, date DATE, ' +
                        ", ".join([f'"{m}_bound" TEXT, "{m}_perc" INTEGER' for m in batch]) + ")")
            pg_conn.commit()

            # COPY batch into staging
            buf = io.StringIO()
            pdf[["symbol", "date"] + [f"{m}_bound" for m in batch] + [f"{m}_perc" for m in batch]].to_csv(
                buf, sep="\t", index=False, header=False, na_rep="\\N"
            )
            buf.seek(0)
            cols = ["symbol", "date"] + [f"{m}_bound" for m in batch] + [f"{m}_perc" for m in batch]
            cols_sql = ", ".join([f'"{c}"' for c in cols])
            cur.copy_expert(
                f"COPY {staging} ({cols_sql}) FROM STDIN WITH (FORMAT text, DELIMITER E'\t', NULL '\\N')", buf
            )
            pg_conn.commit()

            # Add target columns if needed
            with self.engine.begin() as conn:
                for m in batch:
                    conn.execute(text(f'ALTER TABLE {self.target_table} ADD COLUMN IF NOT EXISTS "{m}_bound" TEXT'))
                    conn.execute(text(f'ALTER TABLE {self.target_table} ADD COLUMN IF NOT EXISTS "{m}_perc" INTEGER'))

                set_clause = ", ".join([f'"{m}_bound" = s."{m}_bound", "{m}_perc" = s."{m}_perc"' for m in batch])
                conn.execute(text(f"""
                    UPDATE {self.target_table} t
                    SET {set_clause}
                    FROM {staging} s
                    WHERE t.symbol = s.symbol
                      AND t.date = s.date
                """))

            cur.execute(f"DROP TABLE IF EXISTS {staging}")
            pg_conn.commit()
            logger.info(f"Batch {i // self.BATCH_SIZE + 1} merged.")

        cur.close()
        pg_conn.close()
        logger.info("All batches merged in Financial Metrics Table.")

        logger.info("Running VACUUM FULL ANALYZE on Financial Metrics Table")
        raw_conn = psycopg2.connect(self.DATABASE_URL.replace("postgresql+psycopg2", "postgresql"))
        raw_conn.set_session(autocommit=True)
        raw_cur = raw_conn.cursor()
        raw_cur.execute(f"VACUUM FULL ANALYZE {self.target_table}")
        raw_cur.close()
        raw_conn.close()



if __name__ == "__main__":
    metrics_manager = MetricsManager()
    asyncio.run(metrics_manager.save_financial_metrics())

    percentile_calculator = PercentileCalculator()
    percentile_calculator.run_percentile_calculation()