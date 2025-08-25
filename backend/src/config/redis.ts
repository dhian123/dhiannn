import { createClient, RedisClientType } from 'redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

// Cache utility functions
export class CacheService {
  private static client = getRedisClient;

  static async get(key: string): Promise<string | null> {
    try {
      const client = this.client();
      return await client.get(key);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const client = this.client();
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      const client = this.client();
      await client.del(key);
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const client = this.client();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  static async expire(key: string, ttl: number): Promise<void> {
    try {
      const client = this.client();
      await client.expire(key, ttl);
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
    }
  }

  // Session management
  static async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(data), ttl);
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Rate limiting
  static async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    try {
      const client = this.client();
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttl);
      }
      return count;
    } catch (error) {
      logger.error(`Rate limit increment error for key ${key}:`, error);
      return 0;
    }
  }

  // OTP management
  static async setOTP(phone: string, otp: string, ttl: number = 300): Promise<void> {
    const key = `otp:${phone}`;
    await this.set(key, otp, ttl);
  }

  static async getOTP(phone: string): Promise<string | null> {
    const key = `otp:${phone}`;
    return await this.get(key);
  }

  static async deleteOTP(phone: string): Promise<void> {
    const key = `otp:${phone}`;
    await this.del(key);
  }

  // Real-time notifications
  static async publishNotification(channel: string, message: any): Promise<void> {
    try {
      const client = this.client();
      await client.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error(`Publish notification error for channel ${channel}:`, error);
    }
  }

  static async subscribeToNotifications(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const client = this.client();
      await client.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Error parsing notification message:', error);
        }
      });
    } catch (error) {
      logger.error(`Subscribe notification error for channel ${channel}:`, error);
    }
  }
}