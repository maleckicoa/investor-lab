import os
#import asyncio
import aiohttp
from dotenv import load_dotenv
from typing import List, Dict, Optional, Union
import json
from datetime import datetime

# Load environment variables
load_dotenv()

class FMPAPI:
    def __init__(self):
        self.api_key = os.getenv('FMP_API_KEY')
        if not self.api_key:
            raise ValueError("FMP_API_KEY not found in environment variables")
        
        self.base_url = "https://financialmodelingprep.com"

######################################################## Requests Methods ########################################################
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make an async request to the FMP API and return JSON response."""
        if params is None:
            params = {}
        params['apikey'] = self.api_key
        url = f"{self.base_url}/{endpoint}"
        
        # Log the full URL with parameters
        # full_url = f"{url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
        # print(f"Making request to: {full_url}")
        # print(params)

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"API call failed with status {response.status}")


    async def _make_text_request(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Make an async request to the FMP API and return text response."""
        if params is None:
            params = {}
        params['apikey'] = self.api_key
        
        url = f"{self.base_url}/{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    raise Exception(f"API call failed with status {response.status}")

######################################################## FMP API Methods ########################################################

    async def get_stock_symbols(self) -> Dict:
        """Get list of all available stocks."""
        return await self._make_request("stable/financial-statement-symbol-list")
    
    async def get_stock_info(self, symbols: list) -> list:
        """Get stock info for a list of symbols."""
        try:
            symbols_str = ','.join(symbols)
            return await self._make_request(f"api/v3/profile/{symbols_str}")
        except Exception as e:
            logger.error(f"Error in get_stock_info: {str(e)}")
            return []
    


    async def get_forex_pairs(self) -> Dict:
        """Get all available forex currency pairs."""
        return await self._make_request("stable/forex-list")
    
    async def get_historical_forex(self, forex_pair: str, from_date: str, to_date: str) -> Dict:
        """Get historical forex data for a currency pair."""
        return await self._make_request(
            "stable/historical-price-eod/light",
            {
                "symbol": forex_pair,
                "from": from_date,
                "to": to_date
            }
        )



    async def get_historical_price(self, symbol: str, from_date: str, to_date: str) -> Dict:
        """Get historical price data for a symbol."""
        return await self._make_request(
            "stable/historical-price-eod/full",
            {"symbol": symbol, 
             "from": from_date, 
             "to": to_date}
        )
    async def get_eod_bulk(self, date: str) -> str:
        """Get EOD bulk data for a specific date."""
        endpoint = "stable/eod-bulk"
        params = {"date": date}
        return await self._make_text_request(endpoint, params)



    async def get_historical_mcap(self, symbol: str, from_date: str, to_date: str, limit: int = 10000) -> Dict:
        """Get historical market capitalization data for a symbol."""
        return await self._make_request(
            "stable/historical-market-capitalization",
            {
                "symbol": symbol,
                "from": from_date,
                "to": to_date,
                "limit": limit
            }
        )

    async def get_market_cap_batch(self, symbols: List[str]) -> Dict:
        """Get market capitalization data for multiple symbols in batch."""
        symbols_str = ','.join(symbols)
        return await self._make_request(
            "stable/market-capitalization-batch",
            {"symbols": symbols_str}
        )



