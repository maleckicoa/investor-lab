import os
import time
import psycopg2
from sqlalchemy import create_engine
import polars as pl
import pandas as pd
import logging
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(project_root, ".env.local"))


POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

# Debug print to verify loading
print(f"Loaded DB config: {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

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


def run_query_to_polars_simple(query):
    print("start")
    conn = get_remote_postgres_connection()
    cur = conn.cursor()  # ❌ no server-side name
    cur.execute(query)

    print("execute")
    if cur.description is None:
        print("⚠️ Query ran, but returned no result set.")
        cur.close()
        conn.close()
        return pl.DataFrame()
    print("description")
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    print("fetchall")

    cur.close()
    conn.close()

    if rows:
        # Process rows in batches of 50000
        batch_size = 10000
        dfs = []
        print("loop")
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