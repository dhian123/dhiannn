import knex from 'knex';
import { Model } from 'objection';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Knex configuration
const knexConfig = {
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
  debug: config.env === 'development',
  log: {
    warn(message: string) {
      logger.warn(`Database: ${message}`);
    },
    error(message: string) {
      logger.error(`Database: ${message}`);
    },
    deprecate(message: string) {
      logger.warn(`Database Deprecation: ${message}`);
    },
    debug(message: string) {
      logger.debug(`Database: ${message}`);
    },
  },
};

// Create knex instance
export const db = knex(knexConfig);

// Bind Objection.js to knex
Model.knex(db);

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

// Export for use in models
export { Model };