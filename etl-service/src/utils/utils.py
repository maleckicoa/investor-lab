import os
import psycopg2
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

def get_postgres_connection():
    """Get a direct PostgreSQL connection using psycopg2."""
    return psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host='localhost',
        port=os.getenv('POSTGRES_PORT')
    )

def get_database_url():
    """Get the SQLAlchemy database URL."""
    return f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@localhost:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

def get_logger(name):
    """Get a logger instance with the specified name, configured to log to both console and file."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)  # Ensure logger level is set
    if not logger.handlers:
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        # Console handler
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        # File handler
        fh = logging.FileHandler('etl_service.log')
        fh.setLevel(logging.INFO)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    logger.propagate = False  # Prevent log messages from being passed to the root logger
    return logger

def ensure_schemas_exist():
    conn = get_postgres_connection()
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("CREATE SCHEMA IF NOT EXISTS raw")
    cur.execute("CREATE SCHEMA IF NOT EXISTS clean")

    cur.close()
    conn.close()