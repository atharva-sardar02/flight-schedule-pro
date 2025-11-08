import { Pool, PoolClient } from 'pg';
import logger from './logger';

let dbPool: Pool | null = null;
let readReplicaPool: Pool | null = null;

export function getDbPool(): Pool {
  if (!dbPool) {
    // Optimized connection pool settings for Lambda
    dbPool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      // Optimized pool settings
      max: 5, // Conservative max connections for Lambda (avoid exhaustion)
      min: 0, // Don't maintain idle connections (Lambda-specific)
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Fail fast if can't connect
      // Statement timeout to prevent long-running queries
      statement_timeout: 5000, // 5 seconds max query time
      // Query timeout
      query_timeout: 5000,
      // Keep-alive to detect dead connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
      // Application name for monitoring
      application_name: `flight-schedule-pro-${process.env.ENVIRONMENT || 'dev'}`,
    });

    // Handle pool errors
    dbPool.on('error', (err) => {
      logger.error('Unexpected database pool error', err);
    });

    // Log pool statistics periodically (in development)
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        logger.debug('Database pool stats', {
          totalCount: dbPool?.totalCount || 0,
          idleCount: dbPool?.idleCount || 0,
          waitingCount: dbPool?.waitingCount || 0,
        });
      }, 60000); // Every minute
    }

    logger.info('Database pool created with optimized settings');
  }

  return dbPool;
}

/**
 * Get read replica pool for read-only queries (dashboard, analytics)
 * Falls back to primary pool if read replica not configured
 */
export function getReadReplicaPool(): Pool {
  // In production, use read replica if available
  const readReplicaHost = process.env.DB_READ_REPLICA_HOST;
  
  if (readReplicaHost && !readReplicaPool) {
    readReplicaPool = new Pool({
      host: readReplicaHost,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      statement_timeout: 5000,
      query_timeout: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
      application_name: `flight-schedule-pro-read-${process.env.ENVIRONMENT || 'dev'}`,
    });

    readReplicaPool.on('error', (err) => {
      logger.error('Unexpected read replica pool error', err);
    });

    logger.info('Read replica pool created');
  }

  // Fallback to primary pool if read replica not available
  return readReplicaPool || getDbPool();
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

/**
 * Execute read-only query on read replica (if available)
 * Use this for dashboard queries, analytics, and reporting
 */
export async function queryReadReplica<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getReadReplicaPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

