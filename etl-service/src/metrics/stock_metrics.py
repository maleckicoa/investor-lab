import os
import json
import random
import asyncio
from dotenv import load_dotenv
from ..fmp_api import FMPAPI
from io import StringIO
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
from ..utils.utils import get_postgres_connection, get_database_url, get_logger
from ..utils.models import FinancialRatiosValidator
from typing import Dict, List, Optional

# Get logger
logger = get_logger(__name__)

load_dotenv()

class MetricsManager:
    def __init__(self, max_symbols: int = 300):
        self.database_url = get_database_url()
        self.engine = create_engine(self.database_url)
        self.fmp = FMPAPI()
        self.max_symbols = max_symbols

    def create_metrics_table(self):
        """Create the financial metrics tables in raw and stage schemas."""
        try:
            with self.engine.connect() as conn:
                # Drop existing tables to ensure clean slate
                conn.execute(text("DROP TABLE IF EXISTS raw.financial_metrics"))
                conn.execute(text("DROP TABLE IF EXISTS stage.financial_metrics_stage"))
                conn.commit()
                logger.info("Dropped existing financial metrics tables")
                
                logger.info("Creating fresh financial metrics tables...")
                
                # Create the main table in raw schema
                conn.execute(text("""
                    CREATE TABLE raw.financial_metrics (
                        symbol VARCHAR(20),
                        date DATE,
                        fiscal_year VARCHAR(10),
                        period VARCHAR(10),
                        reported_currency VARCHAR(10),
                        
                        -- Profitability Ratios
                        gross_profit_margin NUMERIC(20, 6),
                        ebit_margin NUMERIC(20, 6),
                        ebitda_margin NUMERIC(20, 6),
                        operating_profit_margin NUMERIC(20, 6),
                        pretax_profit_margin NUMERIC(20, 6),
                        continuous_operations_profit_margin NUMERIC(20, 6),
                        net_profit_margin NUMERIC(20, 6),
                        bottom_line_profit_margin NUMERIC(20, 6),
                        
                        -- Liquidity Ratios
                        current_ratio NUMERIC(20, 6),
                        quick_ratio NUMERIC(20, 6),
                        solvency_ratio NUMERIC(20, 6),
                        cash_ratio NUMERIC(20, 6),
                        
                        -- Efficiency Ratios
                        receivables_turnover NUMERIC(20, 6),
                        payables_turnover NUMERIC(20, 6),
                        inventory_turnover NUMERIC(20, 6),
                        fixed_asset_turnover NUMERIC(20, 6),
                        asset_turnover NUMERIC(20, 6),
                        working_capital_turnover_ratio NUMERIC(20, 6),
                        
                        -- Valuation Ratios
                        price_to_earnings_ratio NUMERIC(20, 6),
                        price_to_earnings_growth_ratio NUMERIC(20, 6),
                        forward_price_to_earnings_growth_ratio NUMERIC(20, 6),
                        price_to_book_ratio NUMERIC(20, 6),
                        price_to_sales_ratio NUMERIC(20, 6),
                        price_to_free_cash_flow_ratio NUMERIC(20, 6),
                        price_to_operating_cash_flow_ratio NUMERIC(20, 6),
                        price_to_fair_value NUMERIC(20, 6),
                        
                        -- Leverage Ratios
                        debt_to_assets_ratio NUMERIC(20, 6),
                        debt_to_equity_ratio NUMERIC(20, 6),
                        debt_to_capital_ratio NUMERIC(20, 6),
                        long_term_debt_to_capital_ratio NUMERIC(20, 6),
                        financial_leverage_ratio NUMERIC(20, 6),
                        debt_to_market_cap NUMERIC(20, 6),
                        
                        -- Cash Flow Ratios
                        operating_cash_flow_ratio NUMERIC(20, 6),
                        operating_cash_flow_sales_ratio NUMERIC(20, 6),
                        free_cash_flow_operating_cash_flow_ratio NUMERIC(20, 6),
                        debt_service_coverage_ratio NUMERIC(20, 6),
                        interest_coverage_ratio NUMERIC(20, 6),
                        short_term_operating_cash_flow_coverage_ratio NUMERIC(20, 6),
                        operating_cash_flow_coverage_ratio NUMERIC(20, 6),
                        capital_expenditure_coverage_ratio NUMERIC(20, 6),
                        dividend_paid_and_capex_coverage_ratio NUMERIC(20, 6),
                        
                        -- Dividend Ratios
                        dividend_payout_ratio NUMERIC(20, 6),
                        dividend_yield NUMERIC(20, 6),
                        dividend_yield_percentage NUMERIC(20, 6),
                        dividend_per_share NUMERIC(20, 6),
                        
                        -- Per Share Metrics
                        revenue_per_share NUMERIC(20, 6),
                        net_income_per_share NUMERIC(20, 6),
                        interest_debt_per_share NUMERIC(20, 6),
                        cash_per_share NUMERIC(20, 6),
                        book_value_per_share NUMERIC(20, 6),
                        tangible_book_value_per_share NUMERIC(20, 6),
                        shareholders_equity_per_share NUMERIC(20, 6),
                        operating_cash_flow_per_share NUMERIC(20, 6),
                        capex_per_share NUMERIC(20, 6),
                        free_cash_flow_per_share NUMERIC(20, 6),
                        
                        -- Additional Ratios
                        net_income_per_ebt NUMERIC(20, 6),
                        ebt_per_ebit NUMERIC(20, 6),
                        effective_tax_rate NUMERIC(20, 6),
                        enterprise_value_multiple NUMERIC(20, 6),
                        
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        
                        PRIMARY KEY (symbol, date, period)
                    )
                """))

                # Create the stage table
                conn.execute(text("""
                    CREATE TABLE stage.financial_metrics_stage (
                        symbol VARCHAR(20),
                        date DATE,
                        fiscal_year VARCHAR(10),
                        period VARCHAR(10),
                        reported_currency VARCHAR(10),
                        
                        -- Profitability Ratios
                        gross_profit_margin NUMERIC(20, 6),
                        ebit_margin NUMERIC(20, 6),
                        ebitda_margin NUMERIC(20, 6),
                        operating_profit_margin NUMERIC(20, 6),
                        pretax_profit_margin NUMERIC(20, 6),
                        continuous_operations_profit_margin NUMERIC(20, 6),
                        net_profit_margin NUMERIC(20, 6),
                        bottom_line_profit_margin NUMERIC(20, 6),
                        
                        -- Liquidity Ratios
                        current_ratio NUMERIC(20, 6),
                        quick_ratio NUMERIC(20, 6),
                        solvency_ratio NUMERIC(20, 6),
                        cash_ratio NUMERIC(20, 6),
                        
                        -- Efficiency Ratios
                        receivables_turnover NUMERIC(20, 6),
                        payables_turnover NUMERIC(20, 6),
                        inventory_turnover NUMERIC(20, 6),
                        fixed_asset_turnover NUMERIC(20, 6),
                        asset_turnover NUMERIC(20, 6),
                        working_capital_turnover_ratio NUMERIC(20, 6),
                        
                        -- Valuation Ratios
                        price_to_earnings_ratio NUMERIC(20, 6),
                        price_to_earnings_growth_ratio NUMERIC(20, 6),
                        forward_price_to_earnings_growth_ratio NUMERIC(20, 6),
                        price_to_book_ratio NUMERIC(20, 6),
                        price_to_sales_ratio NUMERIC(20, 6),
                        price_to_free_cash_flow_ratio NUMERIC(20, 6),
                        price_to_operating_cash_flow_ratio NUMERIC(20, 6),
                        price_to_fair_value NUMERIC(20, 6),
                        
                        -- Leverage Ratios
                        debt_to_assets_ratio NUMERIC(20, 6),
                        debt_to_equity_ratio NUMERIC(20, 6),
                        debt_to_capital_ratio NUMERIC(20, 6),
                        long_term_debt_to_capital_ratio NUMERIC(20, 6),
                        financial_leverage_ratio NUMERIC(20, 6),
                        debt_to_market_cap NUMERIC(20, 6),
                        
                        -- Cash Flow Ratios
                        operating_cash_flow_ratio NUMERIC(20, 6),
                        operating_cash_flow_sales_ratio NUMERIC(20, 6),
                        free_cash_flow_operating_cash_flow_ratio NUMERIC(20, 6),
                        debt_service_coverage_ratio NUMERIC(20, 6),
                        interest_coverage_ratio NUMERIC(20, 6),
                        short_term_operating_cash_flow_coverage_ratio NUMERIC(20, 6),
                        operating_cash_flow_coverage_ratio NUMERIC(20, 6),
                        capital_expenditure_coverage_ratio NUMERIC(20, 6),
                        dividend_paid_and_capex_coverage_ratio NUMERIC(20, 6),
                        
                        -- Dividend Ratios
                        dividend_payout_ratio NUMERIC(20, 6),
                        dividend_yield NUMERIC(20, 6),
                        dividend_yield_percentage NUMERIC(20, 6),
                        dividend_per_share NUMERIC(20, 6),
                        
                        -- Per Share Metrics
                        revenue_per_share NUMERIC(20, 6),
                        net_income_per_share NUMERIC(20, 6),
                        interest_debt_per_share NUMERIC(20, 6),
                        cash_per_share NUMERIC(20, 6),
                        book_value_per_share NUMERIC(20, 6),
                        tangible_book_value_per_share NUMERIC(20, 6),
                        shareholders_equity_per_share NUMERIC(20, 6),
                        operating_cash_flow_per_share NUMERIC(20, 6),
                        capex_per_share NUMERIC(20, 6),
                        free_cash_flow_per_share NUMERIC(20, 6),
                        
                        -- Additional Ratios
                        net_income_per_ebt NUMERIC(20, 6),
                        ebt_per_ebit NUMERIC(20, 6),
                        effective_tax_rate NUMERIC(20, 6),
                        enterprise_value_multiple NUMERIC(20, 6)
                    )
                """))

                conn.commit()
                logger.info("Financial metrics tables created in raw and stage schemas.")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise

    # Index management removed - no indexes needed for simple data writing

    async def get_symbols_from_db(self):
        """Get relevant stock symbols from the database."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT symbol, currency 
                FROM raw.stock_info 
                WHERE relevant = TRUE
            """))
            symbols = [(row[0], row[1]) for row in result]
            logger.info(f"Found {len(symbols)} relevant symbols in database")
            if symbols:
                logger.info(f"Sample symbols: {symbols[:5]}")
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
                        if abs(value) > 1e10:  # Very large numbers (more conservative)
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
                        field_mapping = {
                            'symbol': 'symbol',
                            'date': 'date',
                            'fiscalYear': 'fiscal_year',
                            'period': 'period',
                            'reportedCurrency': 'reported_currency',
                            
                            # Profitability Ratios
                            'grossProfitMargin': 'gross_profit_margin',
                            'ebitMargin': 'ebit_margin',
                            'ebitdaMargin': 'ebitda_margin',
                            'operatingProfitMargin': 'operating_profit_margin',
                            'pretaxProfitMargin': 'pretax_profit_margin',
                            'continuousOperationsProfitMargin': 'continuous_operations_profit_margin',
                            'netProfitMargin': 'net_profit_margin',
                            'bottomLineProfitMargin': 'bottom_line_profit_margin',
                            
                            # Liquidity Ratios
                            'currentRatio': 'current_ratio',
                            'quickRatio': 'quick_ratio',
                            'solvencyRatio': 'solvency_ratio',
                            'cashRatio': 'cash_ratio',
                            
                            # Efficiency Ratios
                            'receivablesTurnover': 'receivables_turnover',
                            'payablesTurnover': 'payables_turnover',
                            'inventoryTurnover': 'inventory_turnover',
                            'fixedAssetTurnover': 'fixed_asset_turnover',
                            'assetTurnover': 'asset_turnover',
                            'workingCapitalTurnoverRatio': 'working_capital_turnover_ratio',
                            
                            # Valuation Ratios
                            'priceToEarningsRatio': 'price_to_earnings_ratio',
                            'priceToEarningsGrowthRatio': 'price_to_earnings_growth_ratio',
                            'forwardPriceToEarningsGrowthRatio': 'forward_price_to_earnings_growth_ratio',
                            'priceToBookRatio': 'price_to_book_ratio',
                            'priceToSalesRatio': 'price_to_sales_ratio',
                            'priceToFreeCashFlowRatio': 'price_to_free_cash_flow_ratio',
                            'priceToOperatingCashFlowRatio': 'price_to_operating_cash_flow_ratio',
                            'priceToFairValue': 'price_to_fair_value',
                            
                            # Leverage Ratios
                            'debtToAssetsRatio': 'debt_to_assets_ratio',
                            'debtToEquityRatio': 'debt_to_equity_ratio',
                            'debtToCapitalRatio': 'debt_to_capital_ratio',
                            'longTermDebtToCapitalRatio': 'long_term_debt_to_capital_ratio',
                            'financialLeverageRatio': 'financial_leverage_ratio',
                            'debtToMarketCap': 'debt_to_market_cap',
                            
                            # Cash Flow Ratios
                            'operatingCashFlowRatio': 'operating_cash_flow_ratio',
                            'operatingCashFlowSalesRatio': 'operating_cash_flow_sales_ratio',
                            'freeCashFlowOperatingCashFlowRatio': 'free_cash_flow_operating_cash_flow_ratio',
                            'debtServiceCoverageRatio': 'debt_service_coverage_ratio',
                            'interestCoverageRatio': 'interest_coverage_ratio',
                            'shortTermOperatingCashFlowCoverageRatio': 'short_term_operating_cash_flow_coverage_ratio',
                            'operatingCashFlowCoverageRatio': 'operating_cash_flow_coverage_ratio',
                            'capitalExpenditureCoverageRatio': 'capital_expenditure_coverage_ratio',
                            'dividendPaidAndCapexCoverageRatio': 'dividend_paid_and_capex_coverage_ratio',
                            
                            # Dividend Ratios
                            'dividendPayoutRatio': 'dividend_payout_ratio',
                            'dividendYield': 'dividend_yield',
                            'dividendYieldPercentage': 'dividend_yield_percentage',
                            'dividendPerShare': 'dividend_per_share',
                            
                            # Per Share Metrics
                            'revenuePerShare': 'revenue_per_share',
                            'netIncomePerShare': 'net_income_per_share',
                            'interestDebtPerShare': 'interest_debt_per_share',
                            'cashPerShare': 'cash_per_share',
                            'bookValuePerShare': 'book_value_per_share',
                            'tangibleBookValuePerShare': 'tangible_book_value_per_share',
                            'shareholdersEquityPerShare': 'shareholders_equity_per_share',
                            'operatingCashFlowPerShare': 'operating_cash_flow_per_share',
                            'capexPerShare': 'capex_per_share',
                            'freeCashFlowPerShare': 'free_cash_flow_per_share',
                            
                            # Additional Ratios
                            'netIncomePerEBT': 'net_income_per_ebt',
                            'ebtPerEbit': 'ebt_per_ebit',
                            'effectiveTaxRate': 'effective_tax_rate',
                            'enterpriseValueMultiple': 'enterprise_value_multiple'
                        }
                        
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
                        str(record.get('symbol', '')),
                        str(record.get('date', '')),
                        str(record.get('fiscal_year', '')),
                        str(record.get('period', '')),
                        str(record.get('reported_currency', '')),
                        
                        # Profitability Ratios
                        str(record.get('gross_profit_margin', '')),
                        str(record.get('ebit_margin', '')),
                        str(record.get('ebitda_margin', '')),
                        str(record.get('operating_profit_margin', '')),
                        str(record.get('pretax_profit_margin', '')),
                        str(record.get('continuous_operations_profit_margin', '')),
                        str(record.get('net_profit_margin', '')),
                        str(record.get('bottom_line_profit_margin', '')),
                        
                        # Liquidity Ratios
                        str(record.get('current_ratio', '')),
                        str(record.get('quick_ratio', '')),
                        str(record.get('solvency_ratio', '')),
                        str(record.get('cash_ratio', '')),
                        
                        # Efficiency Ratios
                        str(record.get('receivables_turnover', '')),
                        str(record.get('payables_turnover', '')),
                        str(record.get('inventory_turnover', '')),
                        str(record.get('fixed_asset_turnover', '')),
                        str(record.get('asset_turnover', '')),
                        str(record.get('working_capital_turnover_ratio', '')),
                        
                        # Valuation Ratios
                        str(record.get('price_to_earnings_ratio', '')),
                        str(record.get('price_to_earnings_growth_ratio', '')),
                        str(record.get('forward_price_to_earnings_growth_ratio', '')),
                        str(record.get('price_to_book_ratio', '')),
                        str(record.get('price_to_sales_ratio', '')),
                        str(record.get('price_to_free_cash_flow_ratio', '')),
                        str(record.get('price_to_operating_cash_flow_ratio', '')),
                        str(record.get('price_to_fair_value', '')),
                        
                        # Leverage Ratios
                        str(record.get('debt_to_assets_ratio', '')),
                        str(record.get('debt_to_equity_ratio', '')),
                        str(record.get('debt_to_capital_ratio', '')),
                        str(record.get('long_term_debt_to_capital_ratio', '')),
                        str(record.get('financial_leverage_ratio', '')),
                        str(record.get('debt_to_market_cap', '')),
                        
                        # Cash Flow Ratios
                        str(record.get('operating_cash_flow_ratio', '')),
                        str(record.get('operating_cash_flow_sales_ratio', '')),
                        str(record.get('free_cash_flow_operating_cash_flow_ratio', '')),
                        str(record.get('debt_service_coverage_ratio', '')),
                        str(record.get('interest_coverage_ratio', '')),
                        str(record.get('short_term_operating_cash_flow_coverage_ratio', '')),
                        str(record.get('operating_cash_flow_coverage_ratio', '')),
                        str(record.get('capital_expenditure_coverage_ratio', '')),
                        str(record.get('dividend_paid_and_capex_coverage_ratio', '')),
                        
                        # Dividend Ratios
                        str(record.get('dividend_payout_ratio', '')),
                        str(record.get('dividend_yield', '')),
                        str(record.get('dividend_yield_percentage', '')),
                        str(record.get('dividend_per_share', '')),
                        
                        # Per Share Metrics
                        str(record.get('revenue_per_share', '')),
                        str(record.get('net_income_per_share', '')),
                        str(record.get('interest_debt_per_share', '')),
                        str(record.get('cash_per_share', '')),
                        str(record.get('book_value_per_share', '')),
                        str(record.get('tangible_book_value_per_share', '')),
                        str(record.get('shareholders_equity_per_share', '')),
                        str(record.get('operating_cash_flow_per_share', '')),
                        str(record.get('capex_per_share', '')),
                        str(record.get('free_cash_flow_per_share', '')),
                        
                        # Additional Ratios
                        str(record.get('net_income_per_ebt', '')),
                        str(record.get('ebt_per_ebit', '')),
                        str(record.get('effective_tax_rate', '')),
                        str(record.get('enterprise_value_multiple', ''))
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
                    cur.copy_from(buffer, "financial_metrics_stage", columns=(
                        'symbol', 'date', 'fiscal_year', 'period', 'reported_currency',
                        
                        # Profitability Ratios
                        'gross_profit_margin', 'ebit_margin', 'ebitda_margin', 'operating_profit_margin',
                        'pretax_profit_margin', 'continuous_operations_profit_margin', 'net_profit_margin',
                        'bottom_line_profit_margin',
                        
                        # Liquidity Ratios
                        'current_ratio', 'quick_ratio', 'solvency_ratio', 'cash_ratio',
                        
                        # Efficiency Ratios
                        'receivables_turnover', 'payables_turnover', 'inventory_turnover',
                        'fixed_asset_turnover', 'asset_turnover', 'working_capital_turnover_ratio',
                        
                        # Valuation Ratios
                        'price_to_earnings_ratio', 'price_to_earnings_growth_ratio',
                        'forward_price_to_earnings_growth_ratio', 'price_to_book_ratio',
                        'price_to_sales_ratio', 'price_to_free_cash_flow_ratio',
                        'price_to_operating_cash_flow_ratio', 'price_to_fair_value',
                        
                        # Leverage Ratios
                        'debt_to_assets_ratio', 'debt_to_equity_ratio', 'debt_to_capital_ratio',
                        'long_term_debt_to_capital_ratio', 'financial_leverage_ratio', 'debt_to_market_cap',
                        
                        # Cash Flow Ratios
                        'operating_cash_flow_ratio', 'operating_cash_flow_sales_ratio',
                        'free_cash_flow_operating_cash_flow_ratio', 'debt_service_coverage_ratio',
                        'interest_coverage_ratio', 'short_term_operating_cash_flow_coverage_ratio',
                        'operating_cash_flow_coverage_ratio', 'capital_expenditure_coverage_ratio',
                        'dividend_paid_and_capex_coverage_ratio',
                        
                        # Dividend Ratios
                        'dividend_payout_ratio', 'dividend_yield', 'dividend_yield_percentage',
                        'dividend_per_share',
                        
                        # Per Share Metrics
                        'revenue_per_share', 'net_income_per_share', 'interest_debt_per_share',
                        'cash_per_share', 'book_value_per_share', 'tangible_book_value_per_share',
                        'shareholders_equity_per_share', 'operating_cash_flow_per_share',
                        'capex_per_share', 'free_cash_flow_per_share',
                        
                        # Additional Ratios
                        'net_income_per_ebt', 'ebt_per_ebit', 'effective_tax_rate',
                        'enterprise_value_multiple'
                    ))

                    # Simple insert from stage to main table (no duplicate checks)
                    cur.execute("""
                        INSERT INTO raw.financial_metrics (
                            symbol, date, fiscal_year, period, reported_currency,
                            
                            -- Profitability Ratios
                            gross_profit_margin, ebit_margin, ebitda_margin, operating_profit_margin,
                            pretax_profit_margin, continuous_operations_profit_margin, net_profit_margin,
                            bottom_line_profit_margin,
                            
                            -- Liquidity Ratios
                            current_ratio, quick_ratio, solvency_ratio, cash_ratio,
                            
                            -- Efficiency Ratios
                            receivables_turnover, payables_turnover, inventory_turnover,
                            fixed_asset_turnover, asset_turnover, working_capital_turnover_ratio,
                            
                            -- Valuation Ratios
                            price_to_earnings_ratio, price_to_earnings_growth_ratio,
                            forward_price_to_earnings_growth_ratio, price_to_book_ratio,
                            price_to_sales_ratio, price_to_free_cash_flow_ratio,
                            price_to_operating_cash_flow_ratio, price_to_fair_value,
                            
                            -- Leverage Ratios
                            debt_to_assets_ratio, debt_to_equity_ratio, debt_to_capital_ratio,
                            long_term_debt_to_capital_ratio, financial_leverage_ratio, debt_to_market_cap,
                            
                            -- Cash Flow Ratios
                            operating_cash_flow_ratio, operating_cash_flow_sales_ratio,
                            free_cash_flow_operating_cash_flow_ratio, debt_service_coverage_ratio,
                            interest_coverage_ratio, short_term_operating_cash_flow_coverage_ratio,
                            operating_cash_flow_coverage_ratio, capital_expenditure_coverage_ratio,
                            dividend_paid_and_capex_coverage_ratio,
                            
                            -- Dividend Ratios
                            dividend_payout_ratio, dividend_yield, dividend_yield_percentage,
                            dividend_per_share,
                            
                            -- Per Share Metrics
                            revenue_per_share, net_income_per_share, interest_debt_per_share,
                            cash_per_share, book_value_per_share, tangible_book_value_per_share,
                            shareholders_equity_per_share, operating_cash_flow_per_share,
                            capex_per_share, free_cash_flow_per_share,
                            
                            -- Additional Ratios
                            net_income_per_ebt, ebt_per_ebit, effective_tax_rate,
                            enterprise_value_multiple
                        )
                        SELECT 
                            symbol, date, fiscal_year, period, reported_currency,
                            
                            -- Profitability Ratios
                            gross_profit_margin, ebit_margin, ebitda_margin, operating_profit_margin,
                            pretax_profit_margin, continuous_operations_profit_margin, net_profit_margin,
                            bottom_line_profit_margin,
                            
                            -- Liquidity Ratios
                            current_ratio, quick_ratio, solvency_ratio, cash_ratio,
                            
                            -- Efficiency Ratios
                            receivables_turnover, payables_turnover, inventory_turnover,
                            fixed_asset_turnover, asset_turnover, working_capital_turnover_ratio,
                            
                            -- Valuation Ratios
                            price_to_earnings_ratio, price_to_earnings_growth_ratio,
                            forward_price_to_earnings_growth_ratio, price_to_book_ratio,
                            price_to_sales_ratio, price_to_free_cash_flow_ratio,
                            price_to_operating_cash_flow_ratio, price_to_fair_value,
                            
                            -- Leverage Ratios
                            debt_to_assets_ratio, debt_to_equity_ratio, debt_to_capital_ratio,
                            long_term_debt_to_capital_ratio, financial_leverage_ratio, debt_to_market_cap,
                            
                            -- Cash Flow Ratios
                            operating_cash_flow_ratio, operating_cash_flow_sales_ratio,
                            free_cash_flow_operating_cash_flow_ratio, debt_service_coverage_ratio,
                            interest_coverage_ratio, short_term_operating_cash_flow_coverage_ratio,
                            operating_cash_flow_coverage_ratio, capital_expenditure_coverage_ratio,
                            dividend_paid_and_capex_coverage_ratio,
                            
                            -- Dividend Ratios
                            dividend_payout_ratio, dividend_yield, dividend_yield_percentage,
                            dividend_per_share,
                            
                            -- Per Share Metrics
                            revenue_per_share, net_income_per_share, interest_debt_per_share,
                            cash_per_share, book_value_per_share, tangible_book_value_per_share,
                            shareholders_equity_per_share, operating_cash_flow_per_share,
                            capex_per_share, free_cash_flow_per_share,
                            
                            -- Additional Ratios
                            net_income_per_ebt, ebt_per_ebit, effective_tax_rate,
                            enterprise_value_multiple
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

    async def save_financial_metrics(self):
        """Main method to fetch and store financial metrics for all relevant stocks."""
        print("\n")
        logger.info(f"######################### Step - MetricsManager initialized with max_symbols={self.max_symbols}")

        self.create_metrics_table()

        symbols_with_currency = await self.get_symbols_from_db()
        if not symbols_with_currency:
            logger.error("No symbols found in database.")
            return False

        # Randomly sample symbols to avoid hitting API limits
        symbols_to_process = random.sample(symbols_with_currency, min(self.max_symbols, len(symbols_with_currency)))
        logger.info(f"Selected {len(symbols_to_process)} symbols for metrics processing.")

        batch_size = 50  # Smaller batch size for metrics API
        total_batches = (len(symbols_to_process) + batch_size - 1) // batch_size

        for i in range(0, len(symbols_to_process), batch_size):
            batch = symbols_to_process[i:i + batch_size]
            logger.info(f"Processing metrics batch {i//batch_size + 1}/{total_batches}")

            start_time = datetime.now().timestamp()
            await self.process_metrics_batch(batch)
            end_time = datetime.now().timestamp()
            duration = end_time - start_time

            logger.info(f"Batch {i//batch_size + 1} took {duration:.2f}s")

            # Rate limiting - wait between batches to avoid API limits
            if i + batch_size < len(symbols_to_process):
                sleep_time = 2  # 2 second delay between batches
                logger.info(f"Sleeping for {sleep_time}s before next batch")
                await asyncio.sleep(sleep_time)

        logger.info("Financial metrics ingestion complete.")
        return True

async def test_api_connection(self):
    """Test the API connection with a simple call."""
    try:
        logger.info("Testing API connection...")
        result = await self.fmp.get_financial_ratios("AAPL", "quarterly", 5)
        logger.info(f"API test successful for AAPL: got {len(result) if isinstance(result, list) else 0} records")
        if result and isinstance(result, list) and len(result) > 0:
            logger.info(f"Sample record keys: {list(result[0].keys())}")
        return True
    except Exception as e:
        logger.error(f"API test failed: {e}")
        return False

if __name__ == "__main__":
    metrics_manager = MetricsManager()
    # Test API first
    asyncio.run(metrics_manager.test_api_connection())
    # Then run the main process with just a few symbols for testing
    metrics_manager.max_symbols = 10  # Test with just 10 symbols
    asyncio.run(metrics_manager.save_financial_metrics())
