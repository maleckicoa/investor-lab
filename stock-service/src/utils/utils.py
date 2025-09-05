import os
import io
import time
import psycopg2
import polars as pl
import pandas as pd
import logging
from sqlalchemy import create_engine
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
# Try production env first, fall back to local if it doesn't exist
env_prod = os.path.join(project_root, ".env.production")
env_local = os.path.join(project_root, ".env.local")

if os.path.exists(env_prod):
    load_dotenv(env_prod)
else:
    load_dotenv(env_local)


POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

def get_remote_postgres_connection():
    """Get a direct PostgreSQL connection to the remote database"""
    return psycopg2.connect(
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT
    )

def get_sqlalchemy_engine():
    """SQLAlchemy engine (recommended for Pandas queries)"""
    db_url = (
        f"postgresql+psycopg2://{POSTGRES_USER}:"
        f"{POSTGRES_PASSWORD}@{POSTGRES_HOST}:"
        f"{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    logging.info(db_url)
    return create_engine(db_url)


def run_query(query: str) -> pd.DataFrame:
    """Execute a SQL query and return a Pandas DataFrame using SQLAlchemy"""
    engine = get_sqlalchemy_engine()

    start = time.time()
    df = pd.read_sql_query(query, engine)
    duration = round(time.time() - start, 2)
    print(f"✅ Query + fetch duration: {duration} seconds")
    return df


########################################################
########################################################
########################################################


def run_query_to_polars_simple(query):
    print(f"QUERY: {query}")

    print(f"STARTING QUERY at {time.strftime('%Y-%m-%d %H:%M:%S')}")

    conn = get_remote_postgres_connection()
    cur = conn.cursor()  # ❌ no server-side name
    cur.execute(query)

    print(f"QUERY EXECUTED at {time.strftime('%Y-%m-%d %H:%M:%S')}")

    if cur.description is None:
        print("⚠️ Query ran, but returned no result set.")
        cur.close()
        conn.close()
        return pl.DataFrame()

    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()

    cur.close()
    conn.close()

    if rows:
        # Process rows in batches of 50000
        batch_size = 10000
        dfs = []

        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            df_batch = pl.DataFrame(batch, schema=columns, orient="row")
            dfs.append(df_batch)
            print(f"✅ Loaded batch {i//batch_size + 1} with {len(batch):,} rows")
            
        if dfs:
            df = pl.concat(dfs)
            print(f"✅ Total rows loaded into Polars: {df.shape[0]:,}")
            return df
        else:
            print("⚠️ Query returned zero rows.")
            return pl.DataFrame()
    
########################################################
########################################################
########################################################

def run_query_to_polars_simple1(query: str) -> pl.DataFrame:
    print(f"⏳ Running query via COPY TO STDOUT {time.strftime('%Y-%m-%d %H:%M:%S')}")

    conn = get_remote_postgres_connection()
    cur = conn.cursor()

    csv_buffer = io.StringIO()
    copy_query = f"COPY ({query}) TO STDOUT WITH CSV HEADER"
    cur.copy_expert(copy_query, csv_buffer)

    cur.close()
    conn.close()

    csv_buffer.seek(0)
    df = pl.read_csv(csv_buffer)
    print(f"✅ Loaded {df.shape[0]:,} rows into Polars via COPY {time.strftime('%Y-%m-%d %H:%M:%S')}")
    return df

    

########################################################
########################################################
########################################################

def run_query_to_polars_simple2(query: str) -> pl.DataFrame:
    print(f"QUERY: {query}")
    print(f"⏳ STARTING QUERY at {time.strftime('%Y-%m-%d %H:%M:%S')}")

    conn = get_remote_postgres_connection()
    cur = conn.cursor(name='my_cursor')  # server-side streaming
    cur.itersize = 50_000
    cur.execute(query)

    batch = cur.fetchmany(50_000)
    if not batch:
        cur.close()
        conn.close()
        print("⚠️ Query returned zero rows.")
        return pl.DataFrame()

    columns = [desc[0] for desc in cur.description]
    all_rows = list(batch)
    total_rows = len(batch)
    batch_num = 1
    print(f"✅ Loaded batch {batch_num} with {len(batch):,} rows")

    while True:
        batch = cur.fetchmany(50_000)
        if not batch:
            break
        all_rows.extend(batch)
        total_rows += len(batch)
        batch_num += 1
        print(f"✅ Loaded batch {batch_num} with {len(batch):,} rows")

    cur.close()
    conn.close()

    print("📦 Converting to Polars...")
    df = pl.DataFrame(all_rows, schema=columns, orient="row")
    print(f"✅ Done: {df.shape[0]:,} rows loaded into Polars")
    return df


########################################################
########################################################
########################################################

def run_query_debug(query: str):
    print("🔌 Connecting to DB...")
    t0 = time.time()
    conn = get_remote_postgres_connection()
    cur = conn.cursor()
    print(f"✅ Connection established in {time.time() - t0:.2f}s")

    print("📤 Running COPY TO STDOUT...")
    t1 = time.time()
    buffer = io.StringIO()
    cur.copy_expert(f"COPY ({query}) TO STDOUT WITH CSV HEADER", buffer)
    t2 = time.time()
    print(f"✅ COPY to buffer done in {t2 - t1:.2f}s")

    print("📥 Loading into Polars...")
    buffer.seek(0)
    df = pl.read_csv(buffer)
    print(f"Number of rows: {df.shape[0]:,}")
    t3 = time.time()
    print(f"✅ Polars parsing done in {t3 - t2:.2f}s")
    print(f"🏁 Total: {t3 - t0:.2f}s")

    cur.close()
    conn.close()
    return df