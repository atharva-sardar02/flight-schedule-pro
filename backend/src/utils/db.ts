import { Pool, PoolClient } from 'pg';
import logger from './logger';

let dbPool: Pool | null = null;

export function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      max: 5, // Conservative max connections for Lambda
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
    });

    logger.info('Database pool created');
  }

  return dbPool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getClient(): Promise<PoolClient> {
  const pool = getDbPool();
  return await pool.connect();
}

