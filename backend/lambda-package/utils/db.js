"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbPool = getDbPool;
exports.getReadReplicaPool = getReadReplicaPool;
exports.query = query;
exports.getClient = getClient;
exports.queryReadReplica = queryReadReplica;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./logger"));
let dbPool = null;
let readReplicaPool = null;
function getDbPool() {
    if (!dbPool) {
        dbPool = new pg_1.Pool({
            host: process.env.DATABASE_HOST,
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
            application_name: `flight-schedule-pro-${process.env.ENVIRONMENT || 'dev'}`,
        });
        dbPool.on('error', (err) => {
            logger_1.default.error('Unexpected database pool error', err);
        });
        if (process.env.NODE_ENV === 'development') {
            setInterval(() => {
                logger_1.default.debug('Database pool stats', {
                    totalCount: dbPool?.totalCount || 0,
                    idleCount: dbPool?.idleCount || 0,
                    waitingCount: dbPool?.waitingCount || 0,
                });
            }, 60000);
        }
        logger_1.default.info('Database pool created with optimized settings');
    }
    return dbPool;
}
function getReadReplicaPool() {
    const readReplicaHost = process.env.DB_READ_REPLICA_HOST;
    if (readReplicaHost && !readReplicaPool) {
        readReplicaPool = new pg_1.Pool({
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
            logger_1.default.error('Unexpected read replica pool error', err);
        });
        logger_1.default.info('Read replica pool created');
    }
    return readReplicaPool || getDbPool();
}
async function query(text, params) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
async function getClient() {
    const pool = getDbPool();
    return await pool.connect();
}
async function queryReadReplica(text, params) {
    const pool = getReadReplicaPool();
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=db.js.map