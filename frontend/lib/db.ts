import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'naro_index_db',
  user: process.env.POSTGRES_USER || 'naro_user',
  password: process.env.POSTGRES_PASSWORD || 'naro_password',
});

export default pool; 