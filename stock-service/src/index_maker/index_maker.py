import time
import polars as pl
from datetime import datetime, date
from typing import Union, Dict
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
    
    if len(selected_countries) > 0:
        countries = "(" + ", ".join(f"'{c}'" for c in selected_countries) + ")"
        countries_condition = f"AND country IN {countries}"
    else:
        countries_condition = ""

    if len(selected_sectors) > 0:
        sectors = "(" + ", ".join(f"'{s}'" for s in selected_sectors) + ")"
        sectors_condition = f"AND sector IN {sectors}"
    else:
        sectors_condition = ""

    if len(selected_industries) > 0:
        industries = "(" + ", ".join(f"'{i}'" for i in selected_industries) + ")"
        industries_condition = f"AND industry IN {industries}"
    else:
        industries_condition = ""


    if len(selected_stocks) > 0:
        stocks = "(" + ", ".join(f"'{c}'" for c in selected_stocks) + ")"
        if len(selected_industries)>0 or len(selected_sectors)>0 or len(selected_countries)>0 or len(kpis)>0: 
            stocks_condition = f"OR symbol IN {stocks}"

        else:
            stocks_condition = f"AND symbol IN {stocks}"
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
    prep6_kpi_cols = ", ".join(f"CAST(p6.{kpi} AS FLOAT8) AS {kpi}" for kpi in active_kpis)

    import time

    query = f"""
    SET enable_mergejoin = off;
    WITH prep1 AS (
        SELECT symbol
        FROM raw.stock_info 
        WHERE 1=1
        {countries_condition}
        {industries_condition}
        {sectors_condition}
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
        {stocks_condition}
    ),
    prep8 AS (
        SELECT 
            p7.date,
            p7.symbol,
            p7.currency,
            p7.year,
            p7.quarter,
            cast(p7.last_quarter_date as BOOLEAN) as last_quarter_date,
            CAST(p7.close as FLOAT8) as close ,
            CAST(p7.close_eur as FLOAT8) as close_eur,
            CAST(p7.close_usd as FLOAT8) as close_usd,
            CAST(p6.market_cap as FLOAT8) as market_cap,
            CAST(p6.market_cap_eur as FLOAT8) as market_cap_eur, 
            CAST(p6.market_cap_usd as FLOAT8) as market_cap_usd,
            {prep6_kpi_cols},
            CAST(p6.mcap_rank as INTEGER) as mcap_rank
        FROM raw.historical_price_volume p7
        INNER JOIN prep6 p6
        ON p7.symbol = p6.symbol
        AND p7.year = p6.next_year
        AND p7.quarter = p6.next_quarter
        WHERE volume_eur > 100000
    )
    SELECT *
    FROM prep8
    --WHERE (EXTRACT(DOW FROM date) = 1 OR last_quarter_date = TRUE)
    """
    df = run_query_to_polars_simple(query)
    print("df")
    return df

########################################################
########################################################
########################################################

def make_index(df: pl.DataFrame,
               index_currency: str = "EUR",
               weight: str = "cap"
               ) -> pl.DataFrame:

    ########## SETUP

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

    if weight == "cap":

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
    elif weight == "equal":

        daily_weights_df = (
            df.select(["date", "symbol"])
              .unique(subset=["date", "symbol"])
              .group_by("date")
              .agg([
                  pl.col("symbol").count().alias("stock_count")
              ])
              .join(
                  df.select(["date", "symbol"]).unique(subset=["date", "symbol"]),
                  on="date"
              )
              .with_columns([
                  (1.0 / pl.col("stock_count")).alias("weight")
              ])
              .select(["date", "symbol", "weight"])
        )
    else:
        raise ValueError(f"Invalid weight parameter: {weight}. Must be 'cap' or 'equal'.")

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
    current_index_value = 1000

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


def make_constituent_weights(df: pl.DataFrame, index_currency: str = "EUR", weight: str = "cap") -> pl.DataFrame:

    mcap_col = "market_cap_eur" if index_currency == "EUR" else "market_cap_usd"
    companies_df = pl.read_csv("src/utils/fields/companies.csv")
    
    if weight == "cap":
        # Market cap weighted - current implementation
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
                  companies_df.select(["symbol", "company_name", "country"]),
                  on="symbol",
                  how="left"
              )
              .with_columns([
                  pl.col("company_name").fill_null(pl.col("symbol"))  # Use symbol as fallback if name not found
              ])
              .select(["year", "quarter", "symbol", "company_name", "country", "weight"])
              .sort(["year", "quarter", "weight"], descending=[True, True, True])
        )
    elif weight == "equal":

        weights_df = (
            df.select(["year", "quarter", "symbol"])
              .group_by(["year", "quarter", "symbol"])
              .agg([
                  pl.col("symbol").count().alias("dummy")  # Just to group by symbol
              ])
              .group_by(["year", "quarter"])
              .agg([
                  pl.col("symbol").count().alias("stock_count")
              ])
              .join(
                  df.select(["year", "quarter", "symbol"]).unique(subset=["year", "quarter", "symbol"]),
                  on=["year", "quarter"]
              )
              .with_columns([
                  (1.0 / pl.col("stock_count")).alias("weight")
              ])
              .join(
                  companies_df.select(["symbol", "company_name", "country"]),
                  on="symbol",
                  how="left"
              )
              .with_columns([
                  pl.col("company_name").fill_null(pl.col("symbol"))  # Use symbol as fallback if name not found
              ])
              .select(["year", "quarter", "symbol", "company_name", "country", "weight"])
              .sort(["year", "quarter", "weight"], descending=[True, True, True])
        )
    else:
        raise ValueError(f"Invalid weight parameter: {weight}. Must be 'cap' or 'equal'.")
    
    return weights_df


########################################################
########################################################
########################################################
########################################################

def trim_index(
    df: pl.DataFrame,
    index_start_amount: float = 1000,
    index_start_date: Union[date, str, None] = "2014-01-01",
    index_end_date: Union[date, str, None] = None,
    ) -> pl.DataFrame:

    if isinstance(index_start_date, str):
        index_start_date = datetime.strptime(index_start_date, "%Y-%m-%d").date()
    if isinstance(index_end_date, str):
        index_end_date = datetime.strptime(index_end_date, "%Y-%m-%d").date()

    df = df.filter(pl.col("date") >= index_start_date)
    if index_end_date:
        df = df.filter(pl.col("date") <= index_end_date)

    df = df.sort("date")

    index_vals = df.get_column("index_value").to_list()
    returns = [1.0]
    for i in range(1, len(index_vals)):
        returns.append(index_vals[i] / index_vals[i - 1])

    # Rebuild new index
    new_index_vals = [float(index_start_amount)]
    for r in returns[1:]:
        new_index_vals.append(new_index_vals[-1] * r)

    # Replace index_value column with new values (as Float64!)
    df = df.with_columns([
        pl.Series(name="index_value", values=new_index_vals, dtype=pl.Float64)
    ]).select(["date", "index_value"])

    # Print before returning
    print("Index values calculated at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print(df)

    return df

########################################################
########################################################
########################################################

def calculate_risk_return(df: pl.DataFrame) -> Dict[str, float]:
    if df.is_empty():
        return {"return": 0.0, "risk": 0.0}
        
    # Sort by date descending to get latest values first
    df = df.sort("date", descending=True)
    
    # Get all values
    values = df.get_column("index_value").to_list()
    dates = df.get_column("date").to_list()
    
    # Check if we have at least 5 years of data
    first_date = dates[-1]
    last_date = dates[0]
    days_between = (last_date - first_date).days
    
    if days_between < 5 * 250:
        return {"return": 0.0, "risk": 0.0}
    
    # Calculate returns between t0 and t-250
    returns = []
    for i in range(len(values)):
        if i + 250 >= len(values):
            break
        t0_val = values[i]
        t250_val = values[i + 250]
        ret = (t0_val / t250_val) - 1
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
        
    return {
        "return": round(float(avg_return), 4),
        "risk": round(float(risk), 4)
    }

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
                        stocks,
                        weight):

    try:

        print(f"Starting index creation at {time.strftime('%Y-%m-%d %H:%M:%S')}")
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
            index_currency=currency,
            weight=weight
            )
        print(f"Index values calculated at {time.strftime('%Y-%m-%d %H:%M:%S')}")

        risk_return = calculate_risk_return(index_df)
        print("risk_return")
        print(risk_return)

        index_df = trim_index(
            index_df,
            index_start_amount=start_amount,
            index_start_date=start_date,
            index_end_date=end_date
        )
        

        constituent_weights = make_constituent_weights(df, currency, weight)
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
            "constituent_weights": constituent_weights.to_dicts(),
            "risk_return": risk_return,
        }
    except Exception as e:
        print(f"❌ Error creating index: {e}")
        raise e
