
import polars as pl
from datetime import datetime, date
from typing import Union
from utils.utils import run_query, run_query_to_polars_simple
#pl.Config.set_tbl_rows(-1)
#pl.Config.set_tbl_cols(-1) 

######################################################## EXAMPLE VALUES
max_constituents = 100
min_volume_eur = 100000
selected_countries = ['US', 'CN']
selected_sectors = ['Technology']
selected_industries = ['Software - Application','Media & Entertainment','Semiconductors', 'Information Technology Services']
selected_stocks = ['']

kpis = {
    'price_to_earnings_ratio_perc': [60, 70, 80, 90, 99, 100],
    'gross_profit_margin_perc': [],
    'net_profit_margin_perc': [],
}

index_start_date = "2015-03-15"
index_end_date = "2025-08-31"
index_currency = "EUR"
########################################################




def make_query(max_constituents, 
               min_volume_eur, 
               selected_countries, 
               selected_sectors, 
               selected_industries, 
               selected_stocks,
               kpis):
    
    industries = "(" + ", ".join(f"'{i}'" for i in selected_industries) + ")"
    sectors = "(" + ", ".join(f"'{s}'" for s in selected_sectors) + ")"
    countries = "(" + ", ".join(f"'{c}'" for c in selected_countries) + ")"
    selected_stocks = "(" + ", ".join(f"'{c}'" for c in selected_stocks) + ")"



    kpi_filters = [
        f"AND {kpi} IN ({', '.join(map(str, values))})"
        for kpi, values in kpis.items() if values
    ]

    kpi_sql = "\n".join(kpi_filters)
    active_kpis = [kpi for kpi, values in kpis.items() if values]
    kpi_cols        = ", ".join(active_kpis)
    prep3_kpi_cols  = ", ".join(f"p3.{kpi}" for kpi in active_kpis)
    #prep6_kpi_cols  = ", ".join(f"prep6.{kpi}" for kpi in active_kpis)
    prep6_kpi_cols = ", ".join(f"CAST(prep6.{kpi} AS FLOAT8) AS {kpi}" for kpi in active_kpis)




    query = f"""
    WITH prep1 AS (
        SELECT symbol
        FROM raw.stock_info 
        WHERE (country IN {countries}
        AND industry IN {industries}
        AND sector IN {sectors})
        OR symbol IN {selected_stocks}
    ),
    prep2 AS (
        SELECT *
        FROM clean.financial_metrics_perc
        WHERE 1=1
        {kpi_sql}
    ),
    prep3 AS (
        SELECT 
            p2.symbol, p2.date, p2.fiscal_year, p2.period, p2.reported_currency,
            {kpi_cols}
        FROM prep2 p2
        INNER JOIN prep1 p1 ON p2.symbol = p1.symbol
    ),
    prep4 AS (
        SELECT 
            hmc.*,
            {prep3_kpi_cols}
        FROM raw.historical_market_cap hmc
        INNER JOIN prep3 p3
        ON hmc.symbol = p3.symbol
        AND hmc.year = p3.fiscal_year
        AND hmc.quarter = p3.period
        WHERE hmc.last_quarter_date = TRUE
        OR (hmc.year = EXTRACT(YEAR FROM CURRENT_DATE)
            AND hmc.quarter = 'Q' || EXTRACT(QUARTER FROM CURRENT_DATE)::INT
        )
    ),
    prep5 AS (
        SELECT 
            p4.*, 
            RANK() OVER (
                PARTITION BY p4.year, p4.quarter 
                ORDER BY p4.market_cap_eur DESC
            ) AS mcap_rank
        FROM prep4 p4
    ),
    prep6 AS (
        SELECT *
        FROM prep5
        WHERE mcap_rank <= {max_constituents}
        OR symbol IN {selected_stocks}
    ),
    prep7 AS (
        SELECT *
        FROM raw.historical_price_volume
        WHERE volume_eur > 100000--{min_volume_eur}
        OR symbol IN {selected_stocks}
    ),
    prep8 AS (
        SELECT 
            prep7.date,
            prep7.symbol,
            prep7.currency,
            prep7.year,
            prep7.quarter,
            prep7.last_quarter_date,
            CAST(prep7.close as FLOAT8) as close ,
            CAST(prep7.close_eur as FLOAT8) as close_eur,
            CAST(prep7.close_usd as FLOAT8) as close_usd,
            CAST(prep6.market_cap as FLOAT8) as market_cap,
            CAST(prep6.market_cap_eur as FLOAT8) as market_cap_eur, 
            CAST(prep6.market_cap_usd as FLOAT8) as market_cap_usd,
            {prep6_kpi_cols},
            CAST(prep6.mcap_rank as INTEGER) as mcap_rank
        FROM prep7
        INNER JOIN prep6
        ON prep7.symbol = prep6.symbol
        AND prep7.year = prep6.year
        AND prep7.quarter = prep6.quarter
    )
    SELECT *
    FROM prep8
    WHERE (EXTRACT(DOW FROM date) = 1 OR last_quarter_date = TRUE)
    """

    df = run_query_to_polars_simple(query)
    return df




def calculate_index_values(df: pl.DataFrame, 
                           index_start_date: Union[date, str, None] = "2015-03-15",
                           index_end_date: Union[date, str, None] = None,
                           index_currency: str = "EUR") -> pl.DataFrame:
    # Step 0: Cast decimals to floats
    decimal_cols = [name for name, dtype in zip(df.columns, df.dtypes) if dtype.base_type() == pl.Decimal]
    df = df.with_columns([pl.col(c).cast(pl.Float64) for c in decimal_cols])

    # Step 1: Parse date column
    if df.schema["date"] == pl.Utf8:
        df = df.with_columns(pl.col("date").str.to_date())
    elif df.schema["date"] != pl.Date:
        df = df.with_columns(pl.col("date").cast(pl.Date))

    # Step 2: Forward-fill prices
    df = (
        df.sort(["symbol", "date"])
          .with_columns([
              pl.col("close_eur").forward_fill().over("symbol")
          ])
    )

    # Step 3: Rebalance snapshots
    rebalance_df = df.filter(pl.col("last_quarter_date") == True)

    rebalance_snapshots = (
        rebalance_df
        .group_by(["year", "quarter"])
        .agg([
            pl.first("date").alias("rebalance_date"),
            pl.col("symbol"),
            pl.col("market_cap_eur")
        ])
    )

    # Step 4: Parse index_start_date
    if isinstance(index_start_date, str):
        index_start_date = datetime.strptime(index_start_date, "%Y-%m-%d").date()

    # Step 5: Find the latest rebalance on or before index_start_date
    initial_snapshot = rebalance_snapshots.filter(pl.col("rebalance_date") <= index_start_date)
    if initial_snapshot.is_empty():
        raise ValueError(f"No rebalance snapshot found on or before {index_start_date}")

    initial_row = initial_snapshot.sort("rebalance_date", descending=True).row(0, named=True)
    initial_weights = {
        s: float(m) / float(sum(initial_row["market_cap_eur"]))
        for s, m in zip(initial_row["symbol"], initial_row["market_cap_eur"])
    }
    active_weights = initial_weights
    last_rebalance_date = initial_row["rebalance_date"]

    # Step 6: Store future quarterly rebalance dates > index_start_date
    future_rebalances = {
        row["rebalance_date"]: {
            s: float(m) / float(sum(row["market_cap_eur"]))
            for s, m in zip(row["symbol"], row["market_cap_eur"])
        }
        for row in rebalance_snapshots.iter_rows(named=True)
        if row["rebalance_date"] > index_start_date
    }

    # Step 7: Pivot prices
    pivot = (
        df.with_columns([
            pl.col("date").cast(pl.Utf8)
        ])
        .select(["date", "symbol", "close_eur"])
        .pivot(index="date", values="close_eur", on="symbol", aggregate_function="first")
        .with_columns([
            pl.col("date").str.to_date()
        ])
        .sort("date")
        .with_columns(
            pl.all().exclude("date").fill_null(strategy="forward")
        )
    )

    pivot = pivot.filter(pl.col("date") >= pl.lit(index_start_date))

    # Step 8: Main loop
    index_value = 1000.0
    index_values = []
    previous_prices = None
    symbol_columns = [c for c in pivot.columns if c != "date"]

    for row in pivot.iter_rows(named=True):
        current_date = row["date"]
        price_row = {s: row[s] for s in symbol_columns}

        # Check if rebalancing today
        if current_date in future_rebalances:
            active_weights = future_rebalances[current_date]
            previous_prices = {s: price_row[s] for s in active_weights if price_row[s] is not None}
            index_values.append((current_date, index_value))
            continue

        # Initialize previous prices on the start date
        if previous_prices is None:
            previous_prices = {s: price_row[s] for s in active_weights if price_row[s] is not None}
            index_values.append((current_date, index_value))
            continue

        # Compute daily return
        returns = {}
        for symbol, prev_price in previous_prices.items():
            current_price = price_row.get(symbol)
            if current_price is not None and prev_price > 0:
                returns[symbol] = current_price / prev_price
            else:
                returns[symbol] = 1.0

        daily_return = sum(
            active_weights[s] * returns.get(s, 1.0) for s in active_weights
        )
        index_value *= daily_return

        # Update previous prices
        for s in previous_prices:
            if price_row.get(s) is not None:
                previous_prices[s] = price_row[s]

        index_values.append((current_date, index_value))

    return pl.DataFrame(index_values, schema=["date", "index_value"], orient="row").sort("date")




def create_custom_index(index_size, currency, start_date, end_date, countries, sectors, industries, kpis, stocks):

    try:
        # Log the received parameters for debugging
        print(f"DEBUG: Received parameters:")
        print(f"  - index_size: {index_size}")
        print(f"  - currency: {currency}")
        print(f"  - start_date: {start_date}")
        print(f"  - end_date: {end_date}")
        print(f"  - countries: {countries}")
        print(f"  - sectors: {sectors}")
        print(f"  - industries: {industries}")
        print(f"  - kpis: {kpis}")
        print(f"  - stocks: {stocks}")
        
        # Set minimum volume based on currency
        min_volume = 100000 if currency == "EUR" else 100000  # Adjust as needed
        
        # Create the query and get the data
        df = make_query(
            max_constituents=index_size,
            min_volume_eur=min_volume,
            selected_countries=countries,
            selected_sectors=sectors,
            selected_industries=industries,
            selected_stocks=stocks,
            kpis=kpis
        )
        
        # Calculate index values
        index_df = calculate_index_values(
            df, 
            index_start_date=start_date,
            index_currency=currency
        )
        
        # Print the output of calculate_index_values function
        print(f"\n📈 INDEX CALCULATION OUTPUT:")
        print(f"DataFrame shape: {index_df.shape}")
        print(f"Columns: {index_df.columns}")
        print(f"First 10 rows:")
        print(index_df.head(10))
        print(f"\nLast 10 rows:")
        print(index_df.tail(10))
        
        # Convert to JSON-serializable format
        index_data = index_df.to_dicts()
        
        # Print the final index result for debugging/monitoring
        print(f"\n🎯 FINAL INDEX RESULT:")
        print(f"   • Total data points: {len(index_data)}")
        print(f"   • Date range: {start_date} to {end_date}")
        print(f"   • Currency: {currency}")
        print(f"   • Index size: {index_size} stocks")
        print(f"   • Countries: {len(countries)}")
        print(f"   • Sectors: {len(sectors)}")
        print(f"   • Industries: {len(industries)}")
        print(f"   • KPIs: {len([k for k, v in kpis.items() if v])}")
        print(f"   • Selected stocks: {len(stocks)}")
        
        # Show sample of index data
        if len(index_data) > 0:
            print(f"\n📊 SAMPLE INDEX DATA (first 5 points):")
            for i, point in enumerate(index_data[:5]):
                print(f"   {i+1}. Date: {point['date']}, Value: {point['index_value']:.2f}")
        
        if len(index_data) > 5:
            print(f"   ... and {len(index_data) - 5} more data points")
        
        print(f"\n✅ Index creation completed successfully!")
        
        return {
            "success": True,
            "message": f"Index created successfully with {len(index_data)} data points",
            "index_size": index_size,
            "currency": currency,
            "start_date": start_date,
            "end_date": end_date,
            "countries_count": len(countries),
            "sectors_count": len(sectors),
            "industries_count": len(industries),
            "kpis_count": len([k for k, v in kpis.items() if v]),
            "stocks_count": len(stocks),
            "index_data": index_data[:100],  # Limit to first 100 points for response size
            "total_data_points": len(index_data)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create index"
        }


if __name__ == "__main__":
    df = make_query(max_constituents, 
                min_volume_eur, 
                selected_countries, 
                selected_sectors, 
                selected_industries, 
                selected_stocks,
                kpis)
    
    index_df = calculate_index_values(df, index_start_date="2014-01-13")
    index_df = calculate_index_values(df, 
                                    index_start_date="2014-01-13",
                                    index_end_date=index_end_date,
                                    index_currency=index_currency)
