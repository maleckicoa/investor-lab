from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

class PriceVolumeValidator(BaseModel):
    date: datetime = Field(description="Date of the price record")
    symbol: str = Field(description="Stock symbol")
    currency: str = Field(max_length=10, description="Currency of the price")
    close: float = Field(ge=0, description="Closing price")
    volume: int = Field(ge=0, description="Trading volume")
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