import pandas as pd
import polars as pl
from typing import List, Dict, Any, Union
from datetime import datetime, date
from .utils import run_query

def normalize_benchmark_data(
    df: pl.DataFrame,
    start_amount: float = 1000,
    start_date: Union[date, str, None] = None,
    end_date: Union[date, str, None] = None,
) -> pl.DataFrame:
    """
    Normalize benchmark data to start from a specific amount, similar to trim_index function.
    """
    if df.is_empty():
        return df
    
    # Convert string dates to date objects
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    # Filter by date range if provided
    if start_date:
        df = df.filter(pl.col("date") >= start_date)
    if end_date:
        df = df.filter(pl.col("date") <= end_date)
    
    df = df.sort("date")
    
    if df.is_empty():
        return df
    
    # Get the values and calculate returns
    values = df.get_column("value").to_list()
    returns = [1.0]
    for i in range(1, len(values)):
        if values[i - 1] != 0:  # Avoid division by zero
            returns.append(values[i] / values[i - 1])
        else:
            returns.append(1.0)
    
    # Rebuild normalized values starting from start_amount
    new_values = [float(start_amount)]
    for r in returns[1:]:
        new_values.append(new_values[-1] * r)
    
    # Replace value column with normalized values
    df = df.with_columns([
        pl.Series(name="value", values=new_values, dtype=pl.Float64)
    ]).select(["date", "value"])
    
    return df

def get_benchmark_historical_data(symbols: List[str], 
                                    start_date: str = None, 
                                    end_date: str = None, 
                                    start_amount: float = 1000, 
                                    currency: str = "USD"
                                    ) -> Dict[str, List[Dict]]:

    if not symbols:
        return {}
    
    # Create the IN clause with quoted symbols
    symbols_str = "', '".join(symbols)
    
    # Determine which currency column to use
    currency_column = "close_usd" if currency.upper() == "USD" else "close_eur"
    
    # Base query - get all data first, we'll filter and normalize later
    query = f"""
    SELECT 
        symbol,
        date,
        {currency_column} as value
    FROM raw.benchmarks 
    WHERE symbol IN ('{symbols_str}')
    AND {currency_column} IS NOT NULL
    ORDER BY symbol, date
    """
    
    try:
        df = run_query(query)
        
        if df.empty:
            return {symbol: [] for symbol in symbols}
        
        # Convert to Polars for easier manipulation
        pl_df = pl.from_pandas(df)
        
        # Group by symbol and normalize each one
        result = {}
        for symbol in symbols:
            symbol_data = pl_df.filter(pl.col("symbol") == symbol)
            
            if not symbol_data.is_empty():
                # Normalize the data using our normalization function
                normalized_data = normalize_benchmark_data(
                    symbol_data,
                    start_amount=start_amount,
                    start_date=start_date,
                    end_date=end_date
                )
                
                # Convert back to list of dictionaries
                result[symbol] = normalized_data.to_pandas().to_dict('records')
            else:
                result[symbol] = []
        
        return result
        
    except Exception as e:
        print(f"Error fetching benchmark data: {e}")
        return {symbol: [] for symbol in symbols}



def calculate_benchmark_risk_return(df: pd.DataFrame) -> Dict[str, float]:

    default_result = {
        "data_points": 0,
        "return_eur": 0.0,
        "return_usd": 0.0,
        "risk_eur": 0.0,
        "risk_usd": 0.0
        }

    if df.empty:
        return default_result
    
    # if data has gap > 30 days, return default result
    df = df.sort_values('date', ascending=False)
    df["gap"] = df["date"].diff(periods=-1) 
    has_gap = (df["gap"] > pd.Timedelta(days=30)).any()

    if has_gap:
        return default_result
    
    # Check if we have at least 5 years of data
    today = pd.Timestamp.today().normalize().date()
    first_date = df['date'].min()
    last_date = df['date'].max()
    days_between_min_max = (last_date - first_date).days
    days_between_today_max = (today - last_date).days
    
    if days_between_min_max < 5 * 365:
        return default_result

    if days_between_today_max > 30:
        return default_result
    results = {}
    
    # Calculate for both EUR and USD
    for currency in ['eur', 'usd']:
        col = f'close_{currency}'


        ratio = df[col] / df[col].shift(-1)
        has_outlier_jump = ((ratio >= 10) | (ratio <= 0.1)).any()
        if has_outlier_jump:
            return default_result
        
        # Calculate returns between t0 and t-250
        returns = []
        values = df[col].values
        for i in range(len(values)):
            if i + 250 >= len(values):
                break
            t0_val = values[i]
            t250_val = values[i + 250]
            if t0_val>=0 and t250_val>=0:
                ret = (t0_val / t250_val) - 1
                if abs(ret) < 1000 :
                    returns.append(ret)
        
        # Calculate average return
        avg_return = sum(returns) / len(returns) if returns else 0.0
        
        # Calculate risk (std dev of negative returns)
        neg_returns = [r for r in returns if r < 0]
        risk = 0.0
        if neg_returns:
            mean = sum(neg_returns) / len(neg_returns)
            squared_diff = [(r - mean) ** 2 for r in neg_returns]
            risk = (sum(squared_diff) / len(neg_returns)) ** 0.5
            
        results[f'return_{currency}'] = round(float(avg_return), 4)
        results[f'risk_{currency}'] = round(float(risk), 4)
        results["data_points"] = len(returns)
    return results