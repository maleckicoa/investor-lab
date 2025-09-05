import time
import polars as pl
from datetime import datetime, date
from typing import Union
from utils.utils import run_query, run_query_to_polars_simple, run_query_debug, run_query_to_polars_simple1, run_query_to_polars_simple2
pl.Config.set_tbl_rows(-1)
pl.Config.set_tbl_cols(-1) 
pl.Config.set_tbl_rows(None)
pl.Config.set_tbl_cols(None) 

######################################################## EXAMPLE VALUES
# max_constituents = 100
# min_volume_eur = 100000
# selected_countries = ['US', 'CN']
# selected_sectors = ['Technology']
# selected_industries = ['Software - Application','Media & Entertainment','Semiconductors', 'Information Technology Services']
# selected_stocks = ['']

# kpis = {
#     'price_to_earnings_ratio_perc': [60, 70, 80, 90, 99, 100],
#     'gross_profit_margin_perc': [],
#     'net_profit_margin_perc': [],
# }

# index_start_date = "2015-03-15"
# index_end_date = "2025-08-31"
# index_currency = "EUR"
########################################################




def make_query(max_constituents, 
               selected_countries, 
               selected_sectors, 
               selected_industries, 
               selected_stocks,
               kpis):
    
    industries = "(" + ", ".join(f"'{i}'" for i in selected_industries) + ")"
    sectors = "(" + ", ".join(f"'{s}'" for s in selected_sectors) + ")"
    countries = "(" + ", ".join(f"'{c}'" for c in selected_countries) + ")"
    
    # Handle empty selected_stocks list to avoid SQL syntax error
    if selected_stocks and len(selected_stocks) > 0:
        selected_stocks_sql = "(" + ", ".join(f"'{c}'" for c in selected_stocks) + ")"
        stocks_condition = f"OR symbol IN {selected_stocks_sql}"
    else:
        stocks_condition = ""


    # If no KPIs provided, select everything basicaly
    if not kpis:
        kpis = {
            'asset_turnover_perc': ['1', '20', '30', '40', '50', '60', '70', '80', '90', '99', '100']
        }

    kpi_filters = []
    for kpi, values in kpis.items():
        if values:
            quoted_values = [f"'{v}'" for v in values]
            kpi_filters.append(f"AND {kpi} IN ({', '.join(quoted_values)})")

    kpi_sql = "\n".join(kpi_filters)
    active_kpis = [kpi for kpi, values in kpis.items() if values]
    kpi_cols        = ", ".join(active_kpis)
    prep3_kpi_cols  = ", ".join(f"p3.{kpi}" for kpi in active_kpis)
    #prep6_kpi_cols  = ", ".join(f"prep6.{kpi}" for kpi in active_kpis)
    prep6_kpi_cols = ", ".join(f"CAST(prep6.{kpi} AS FLOAT8) AS {kpi}" for kpi in active_kpis)

    import time

    query = f"""
    SET enable_mergejoin = off;
    WITH prep1 AS (
        SELECT symbol
        FROM raw.stock_info 
        WHERE (country IN {countries}
        AND industry IN {industries}
        AND sector IN {sectors})
        {stocks_condition}
    ),
    prep2 AS (
        SELECT *
        FROM clean.financial_metrics_perc
        WHERE 1=1
        {kpi_sql}
        {stocks_condition}
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
    'Q' || (
        CASE 
            --WHEN EXTRACT(YEAR FROM hmc.date)::INT = 2013 THEN 4
            WHEN EXTRACT(QUARTER FROM hmc.date)::INT = 4 THEN 1
            ELSE EXTRACT(QUARTER FROM hmc.date)::INT + 1
        END
    ) AS next_quarter,
    CASE 
        --WHEN EXTRACT(YEAR FROM hmc.date)::INT = 2013 THEN 2013
        WHEN EXTRACT(QUARTER FROM hmc.date)::INT = 4 THEN EXTRACT(YEAR FROM hmc.date)::INT + 1
        ELSE EXTRACT(YEAR FROM hmc.date)::INT
    END AS next_year,
            {prep3_kpi_cols}
        FROM raw.historical_market_cap hmc
        INNER JOIN prep3 p3
        ON hmc.symbol = p3.symbol
        AND hmc.year = p3.fiscal_year
        AND hmc.quarter = p3.period
        WHERE hmc.last_quarter_date = TRUE
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
        {f"OR symbol IN {selected_stocks_sql}" if selected_stocks and len(selected_stocks) > 0 else ""}
    ),
    prep8 AS (
        SELECT 
            prep7.date,
            prep7.symbol,
            prep7.currency,
            prep7.year,
            prep7.quarter,
            cast(prep7.last_quarter_date as BOOLEAN) as last_quarter_date,
            CAST(prep7.close as FLOAT8) as close ,
            CAST(prep7.close_eur as FLOAT8) as close_eur,
            CAST(prep7.close_usd as FLOAT8) as close_usd,
            CAST(prep6.market_cap as FLOAT8) as market_cap,
            CAST(prep6.market_cap_eur as FLOAT8) as market_cap_eur, 
            CAST(prep6.market_cap_usd as FLOAT8) as market_cap_usd,
            {prep6_kpi_cols},
            CAST(prep6.mcap_rank as INTEGER) as mcap_rank
        FROM raw.historical_price_volume prep7
        INNER JOIN prep6
        ON prep7.symbol = prep6.symbol
        AND prep7.year = prep6.next_year
        AND prep7.quarter = prep6.next_quarter
        WHERE volume_eur > 100000
    )
    SELECT *
    FROM prep8
    --WHERE (EXTRACT(DOW FROM date) = 1 OR last_quarter_date = TRUE)
    """
    df = run_query_to_polars_simple(query)
    print("df")
    df.head(100).write_csv("first_100_rows.csv")
    return df

########################################################
########################################################
########################################################


def make_index(df: pl.DataFrame,
               index_start_date: Union[date, str, None] = "2014-01-01",
               index_end_date: Union[date, str, None] = None,
               index_currency: str = "EUR",
               index_start_amount: float = 1000.0) -> pl.DataFrame:

    ########## SETUP

    if isinstance(index_start_date, str):
        index_start_date = datetime.strptime(index_start_date, "%Y-%m-%d").date()

    if isinstance(index_end_date, str):
        index_end_date = datetime.strptime(index_end_date, "%Y-%m-%d").date()


    decimal_cols = [name for name, dtype in zip(df.columns, df.dtypes) if dtype.base_type() == pl.Decimal]
    df = df.with_columns([pl.col(c).cast(pl.Float64) for c in decimal_cols])

    if df.schema["date"] == pl.Utf8:
        df = df.with_columns(pl.col("date").str.to_date())
    elif df.schema["date"] != pl.Date:
        df = df.with_columns(pl.col("date").cast(pl.Date))

    price_col = "close_eur" if index_currency == "EUR" else "close_usd"
    mcap_col = "market_cap_eur" if index_currency == "EUR" else "market_cap_usd"

    ############ PRICES PIVOT
    # Create prices_pivot: date as index, columns = symbols
    prices_pivot = (
        df.select(["date", "symbol", price_col])
          .pivot(index="date", columns="symbol", values=price_col)
          .sort("date")
          .with_columns([
              pl.all().exclude("date").forward_fill()
          ])
    )

    ########### WEIGHTS PIVOT

    daily_mcap_df = (
        df.select(["date", "symbol", mcap_col])
          .filter(pl.col(mcap_col).is_not_null())
          .unique(subset=["date", "symbol"])
    )

    total_mcap_df = (
        daily_mcap_df
        .group_by("date")
        .agg(pl.col(mcap_col).sum().alias("total_mcap"))
    )

    daily_weights_df = (
        daily_mcap_df.join(total_mcap_df, on="date")
                     .with_columns([
                         (pl.col(mcap_col) / pl.col("total_mcap")).alias("weight")
                     ])
                     .select(["date", "symbol", "weight"])
    )

    weights_pivot = (
        daily_weights_df
        .pivot(index="date", columns="symbol", values="weight")
        .sort("date")
        .with_columns([
            pl.all().exclude("date").fill_null(0.0)
        ])
    )

    # Ensure same columns & order
    symbols = [col for col in prices_pivot.columns if col != "date"]
    prices_pivot = prices_pivot.select(["date"] + symbols)
    weights_pivot = weights_pivot.select(["date"] + symbols)

    print("prices_pivot")
    print(prices_pivot)
    print("weights_pivot")
    print(weights_pivot)

    ########### REBALANCE DATES
    rebalance_dates = (
        pl.concat([
            df.select("date").sort("date").limit(1),
            df.filter(pl.col("last_quarter_date") == True).select("date")
        ])
        .unique()
        .sort("date")
    )
    rebalance_dates_list = rebalance_dates["date"].to_list()

    ########### SHARES DF

    shares_chunks = []
    current_index_value = index_start_amount

    for i, start_date in enumerate(rebalance_dates_list):
        end_date = rebalance_dates_list[i + 1] if i + 1 < len(rebalance_dates_list) else None

        # Filter date range
        date_mask = pl.col("date") >= start_date
        if end_date:
            date_mask &= pl.col("date") < end_date

        # Slice relevant date range
        period_dates = prices_pivot.filter(date_mask).select("date")

        # Get prices and weights at start_date
        prices = prices_pivot.filter(pl.col("date") == start_date).select(symbols)
        weights = weights_pivot.filter(pl.col("date") == start_date).select(symbols)

        # Compute shares for this period using current index value
        shares = [
            (weights[s][0] * current_index_value / prices[s][0]) if prices[s][0] not in [None, 0.0] else 0.0
            for s in symbols
        ]

        # Repeat shares for all dates in the period
        repeated_shares = period_dates.with_columns([
            pl.lit(share).alias(sym) for sym, share in zip(symbols, shares)
        ])
        shares_chunks.append(repeated_shares)

        # Update index value using last available date in period
        last_date = period_dates["date"][-1]
        last_prices = prices_pivot.filter(pl.col("date") == last_date).select(symbols)

        current_index_value = sum([
            share * last_prices[s][0] if last_prices[s][0] is not None else 0.0
            for s, share in zip(symbols, shares)
        ])

    shares_df = pl.concat(shares_chunks).sort("date")
    print("shares_df")
    print(shares_df)


    ########### INDEX
    values_df = (
        shares_df
        .join(prices_pivot, on="date", suffix="_price")
        .with_columns([
            (pl.col(sym) * pl.col(f"{sym}_price")).alias(sym)
            for sym in symbols
        ])
        .select(["date"] + symbols)
    )

    # Final index = sum of all values per day
    index_df = (
        values_df
        .with_columns([
            pl.sum_horizontal(pl.all().exclude("date")).alias("index_value")
        ])
        .select(["date", "index_value"])
    )

    # Print index head and tail
    #pl.Config.set_tbl_rows(10000)
    print("\n📈 First 10 index values:")
    print(index_df.head(100))

    print("\n📉 Last 10 index values:")
    print(index_df.tail(10))
    
    return index_df
########################################################
########################################################
########################################################



def make_constituent_weights(df: pl.DataFrame, index_currency: str = "EUR") -> pl.DataFrame:
    """Create constituent weights DataFrame with company names.
    
    Args:
        df: DataFrame with market cap data
        index_currency: Currency for the index ("EUR" or "USD")
    
    Returns data in format: year, quarter, symbol, company_name, weight
    Only includes companies that have weight > 0 for each quarter.
    """
    
    # Select currency columns (same logic as make_index)
    mcap_col = "market_cap_eur" if index_currency == "EUR" else "market_cap_usd"
    
    # Load companies mapping
    companies_df = pl.read_csv("/Users/aleksamihajlovic/Documents/naro-index-advisor/stock-service/src/utils/fields/companies.csv")
    
    # Get max market cap for each stock within each quarter and calculate weights
    weights_df = (
        df.select(["year", "quarter", "symbol", mcap_col])
          .group_by(["year", "quarter", "symbol"])
          .agg([
              pl.col(mcap_col).max().alias("max_market_cap")
          ])
          .group_by(["year", "quarter"])
          .agg([
              pl.col("max_market_cap").sum().alias("total_mcap")
          ])
          .join(
              df.select(["year", "quarter", "symbol", mcap_col])
                .group_by(["year", "quarter", "symbol"])
                .agg([
                    pl.col(mcap_col).max().alias("max_market_cap")
                ]),
              on=["year", "quarter"]
          )
          .with_columns([
              (pl.col("max_market_cap") / pl.col("total_mcap")).alias("weight")
          ])
          .filter(pl.col("weight") > 0)  # Only include companies with weight > 0
          .join(
              companies_df.select(["symbol", "company_name"]),
              on="symbol",
              how="left"
          )
          .with_columns([
              pl.col("company_name").fill_null(pl.col("symbol"))  # Use symbol as fallback if name not found
          ])
          .select(["year", "quarter", "symbol", "company_name", "weight"])
          .sort(["year", "quarter", "weight"], descending=[True, True, True])
    )
    
    return weights_df


########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################
########################################################

def create_custom_index(index_size,
                        currency, 
                        start_amount, 
                        start_date, 
                        end_date, 
                        countries, 
                        sectors, 
                        industries, 
                        kpis, 
                        stocks):

    try:

        print(f"Starting index creation at {time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Log the received parameters for debugging
        print(f"DEBUG: Received parameters:")
        print(f"  - index_size: {index_size}")
        print(f"  - currency: {currency}")
        print(f"  - start_amount: {start_amount}")
        print(f"  - start_date: {start_date}")
        print(f"  - end_date: {end_date}")
        print(f"  - countries: {countries}")
        print(f"  - sectors: {sectors}")
        print(f"  - industries: {industries}")
        print(f"  - kpis: {kpis}")
        print(f"  - stocks: {stocks}")
        

        # Create the query and get the data
        df = make_query(
            max_constituents=index_size,
            selected_countries=countries,
            selected_sectors=sectors,
            selected_industries=industries,
            selected_stocks=stocks,
            kpis=kpis
        )
        print(f"Index data loaded at {time.strftime('%Y-%m-%d %H:%M:%S')}")


        index_df = make_index(
            df, 
            index_start_date=start_date,
            index_end_date=end_date,
            index_currency=currency,
            index_start_amount=start_amount
        )
        print(f"Index values calculated at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        

        constituent_weights = make_constituent_weights(df, currency)
        print("constituent_weights")
        print(constituent_weights)

        print("index_df_to dict")
        index_data = index_df.to_dicts()
        
        # Print the final index result for debugging/monitoring
        print(f"\n🎯 FINAL INDEX RESULT:")
        print(f"   • Total data points: {len(index_data)}")
        print(f"   • Date range: {start_date} to {end_date}")
        print(f"   • Currency: {currency}")
        print(f"   • Start amount: {start_amount}")
        print(f"   • Index size: {index_size} stocks")
        print(f"   • Countries: {len(countries)}")
        print(f"   • Sectors: {len(sectors)}")
        print(f"   • Industries: {len(industries)}")
        print(f"   • KPIs: {len([k for k, v in kpis.items() if v])}")
        print(f"   • Selected stocks: {len(stocks)}")
        

        print(f"\n✅ Index creation completed successfully!")
        
        return {
            "index_df": index_df.to_dicts(), 
            "constituent_weights": constituent_weights.to_dicts()
        }
    except Exception as e:
        print(f"❌ Error creating index: {e}")
        raise e
