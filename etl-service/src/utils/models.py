from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

class PriceVolumeValidator(BaseModel):
    date: datetime = Field(description="Date of the price record")
    symbol: str = Field(description="Stock symbol")
    currency: str = Field(max_length=10, description="Currency of the price")
    close: float = Field(ge=0, description="Closing price")
    volume: int = Field(ge=0, description="Trading volume")
    year: int = Field(description="Year of the price record")
    quarter: str = Field(description="Quarter of the price record, e.g., Q1")
    last_quarter_date: bool = Field(description="Indicates if the date is the last date of the quarter")
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation timestamp")

class PriceVolumeFxValidator(PriceVolumeValidator):
    close_eur: float = Field(ge=0, description="Closing price in EUR")
    close_usd: float = Field(ge=0, description="Closing price in USD")
    volume_eur: int = Field(ge=0, description="Volume in EUR")
    volume_usd: int = Field(ge=0, description="Volume in USD")

class MarketCapValidator(BaseModel):
    date: datetime = Field(description="Date of the market cap record")
    symbol: str = Field(description="Stock symbol")
    currency: str = Field(max_length=10, description="Currency of the market cap")
    market_cap: int = Field(ge=0, description="Market capitalization value")
    year: int = Field(description="Year of the market cap record")
    quarter: str = Field(description="Quarter of the market cap record, e.g., Q1")
    last_quarter_date: bool = Field(description="Indicates if the date is the last date of the quarter")
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation timestamp")

class McapFxValidator(MarketCapValidator):
    market_cap_eur: int = Field(ge=0, description="Market capitalization in EUR")
    market_cap_usd: int = Field(ge=0, description="Market capitalization in USD")

class ForexRawValidator(BaseModel):
    date: datetime
    forex_pair: str
    price: float
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation timestamp")

class ForexCleanValidator(BaseModel):
    date: datetime
    forex_pair: str
    price: float
    ccy_left: str
    ccy_right: str
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation timestamp")

class StockInfoValidator(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    price: Optional[float] = Field(None, ge=0)
    beta: Optional[float] = None
    vol_avg: Optional[float] = Field(None, ge=0)
    mkt_cap: Optional[float] = Field(None, ge=0)
    last_div: Optional[float] = Field(None, ge=0)
    range: Optional[str] = Field(None, max_length=50)
    changes: Optional[float] = None
    company_name: Optional[str] = Field(None, max_length=255)
    currency: Optional[str] = Field(None, max_length=10)
    cik: Optional[str] = Field(None, max_length=20)
    isin: Optional[str] = Field(None, max_length=20)
    cusip: Optional[str] = Field(None, max_length=20)
    exchange: Optional[str] = Field(None, max_length=50)
    exchange_short_name: Optional[str] = Field(None, max_length=20)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    ceo: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    full_time_employees: Optional[int] = Field(None, ge=0)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip: Optional[str] = Field(None, max_length=20)
    dcf_diff: Optional[float] = None
    dcf: Optional[float] = None
    image: Optional[str] = Field(None, max_length=255)
    ipo_date: Optional[date] = None
    default_image: Optional[bool] = None
    is_etf: Optional[bool] = None
    is_actively_trading: Optional[bool] = None
    is_adr: Optional[bool] = None
    is_fund: Optional[bool] = None

class FinancialRatiosValidator(BaseModel):
    """Validator for financial ratios data from FMP API."""
    symbol: str = Field(..., max_length=20, description="Stock symbol")
    date: datetime = Field(description="Date of the financial ratios")
    fiscal_year: str = Field(..., max_length=10, description="Fiscal year")
    period: str = Field(..., max_length=10, description="Period (Q1, Q2, Q3, Q4, FY)")
    reported_currency: str = Field(..., max_length=10, description="Currency of the reported data")
    
    # Profitability Ratios
    gross_profit_margin: Optional[float] = Field(None, description="Gross profit margin")
    ebit_margin: Optional[float] = Field(None, description="EBIT margin")
    ebitda_margin: Optional[float] = Field(None, description="EBITDA margin")
    operating_profit_margin: Optional[float] = Field(None, description="Operating profit margin")
    pretax_profit_margin: Optional[float] = Field(None, description="Pretax profit margin")
    continuous_operations_profit_margin: Optional[float] = Field(None, description="Continuous operations profit margin")
    net_profit_margin: Optional[float] = Field(None, description="Net profit margin")
    bottom_line_profit_margin: Optional[float] = Field(None, description="Bottom line profit margin")
    
    # Liquidity Ratios
    current_ratio: Optional[float] = Field(None, description="Current ratio")
    quick_ratio: Optional[float] = Field(None, description="Quick ratio")
    solvency_ratio: Optional[float] = Field(None, description="Solvency ratio")
    cash_ratio: Optional[float] = Field(None, description="Cash ratio")
    
    # Efficiency Ratios
    receivables_turnover: Optional[float] = Field(None, description="Receivables turnover")
    payables_turnover: Optional[float] = Field(None, description="Payables turnover")
    inventory_turnover: Optional[float] = Field(None, description="Inventory turnover")
    fixed_asset_turnover: Optional[float] = Field(None, description="Fixed asset turnover")
    asset_turnover: Optional[float] = Field(None, description="Asset turnover")
    working_capital_turnover_ratio: Optional[float] = Field(None, description="Working capital turnover ratio")
    
    # Valuation Ratios
    price_to_earnings_ratio: Optional[float] = Field(None, description="P/E ratio")
    price_to_earnings_growth_ratio: Optional[float] = Field(None, description="P/E growth ratio")
    forward_price_to_earnings_growth_ratio: Optional[float] = Field(None, description="Forward P/E growth ratio")
    price_to_book_ratio: Optional[float] = Field(None, description="P/B ratio")
    price_to_sales_ratio: Optional[float] = Field(None, description="P/S ratio")
    price_to_free_cash_flow_ratio: Optional[float] = Field(None, description="P/FCF ratio")
    price_to_operating_cash_flow_ratio: Optional[float] = Field(None, description="P/OCF ratio")
    price_to_fair_value: Optional[float] = Field(None, description="Price to fair value")
    
    # Leverage Ratios
    debt_to_assets_ratio: Optional[float] = Field(None, description="Debt to assets ratio")
    debt_to_equity_ratio: Optional[float] = Field(None, description="Debt to equity ratio")
    debt_to_capital_ratio: Optional[float] = Field(None, description="Debt to capital ratio")
    long_term_debt_to_capital_ratio: Optional[float] = Field(None, description="Long term debt to capital ratio")
    financial_leverage_ratio: Optional[float] = Field(None, description="Financial leverage ratio")
    debt_to_market_cap: Optional[float] = Field(None, description="Debt to market cap")
    
    # Cash Flow Ratios
    operating_cash_flow_ratio: Optional[float] = Field(None, description="Operating cash flow ratio")
    operating_cash_flow_sales_ratio: Optional[float] = Field(None, description="Operating cash flow sales ratio")
    free_cash_flow_operating_cash_flow_ratio: Optional[float] = Field(None, description="FCF/OCF ratio")
    debt_service_coverage_ratio: Optional[float] = Field(None, description="Debt service coverage ratio")
    interest_coverage_ratio: Optional[float] = Field(None, description="Interest coverage ratio")
    short_term_operating_cash_flow_coverage_ratio: Optional[float] = Field(None, description="Short term OCF coverage ratio")
    operating_cash_flow_coverage_ratio: Optional[float] = Field(None, description="Operating cash flow coverage ratio")
    capital_expenditure_coverage_ratio: Optional[float] = Field(None, description="Capital expenditure coverage ratio")
    dividend_paid_and_capex_coverage_ratio: Optional[float] = Field(None, description="Dividend paid and capex coverage ratio")
    
    # Dividend Ratios
    dividend_payout_ratio: Optional[float] = Field(None, description="Dividend payout ratio")
    dividend_yield: Optional[float] = Field(None, description="Dividend yield")
    dividend_yield_percentage: Optional[float] = Field(None, description="Dividend yield percentage")
    dividend_per_share: Optional[float] = Field(None, description="Dividend per share")
    
    # Per Share Metrics
    revenue_per_share: Optional[float] = Field(None, description="Revenue per share")
    net_income_per_share: Optional[float] = Field(None, description="Net income per share")
    interest_debt_per_share: Optional[float] = Field(None, description="Interest debt per share")
    cash_per_share: Optional[float] = Field(None, description="Cash per share")
    book_value_per_share: Optional[float] = Field(None, description="Book value per share")
    tangible_book_value_per_share: Optional[float] = Field(None, description="Tangible book value per share")
    shareholders_equity_per_share: Optional[float] = Field(None, description="Shareholders equity per share")
    operating_cash_flow_per_share: Optional[float] = Field(None, description="Operating cash flow per share")
    capex_per_share: Optional[float] = Field(None, description="Capital expenditure per share")
    free_cash_flow_per_share: Optional[float] = Field(None, description="Free cash flow per share")
    
    # Additional Ratios
    net_income_per_ebt: Optional[float] = Field(None, description="Net income per EBT")
    ebt_per_ebit: Optional[float] = Field(None, description="EBT per EBIT")
    effective_tax_rate: Optional[float] = Field(None, description="Effective tax rate")
    enterprise_value_multiple: Optional[float] = Field(None, description="Enterprise value multiple")
    
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation timestamp") 