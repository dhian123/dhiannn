const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4, // IPv4
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'sinusa:',
};

// Create Redis instances
const redis = new Redis(redisConfig);
const redisPub = new Redis(redisConfig); // For publishing
const redisSub = new Redis(redisConfig); // For subscribing

// Redis event handlers
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redis.on('close', () => {
  logger.info('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redis.connect();
    await redisPub.connect();
    await redisSub.connect();
    logger.info('All Redis connections established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Close Redis connections
const closeRedis = async () => {
  try {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
    logger.info('All Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections:', error);
  }
};

// Cache utilities
const cache = {
  // Get data from cache
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Set data in cache
  async set(key, data, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  // Delete from cache
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set with expiration
  async setWithExpiry(key, data, seconds) {
    try {
      await redis.setex(key, seconds, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache setWithExpiry error:', error);
      return false;
    }
  },

  // Increment counter
  async incr(key, ttl = null) {
    try {
      const result = await redis.incr(key);
      if (ttl && result === 1) {
        await redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Cache incr error:', error);
      return 0;
    }
  },

  // Get multiple keys
  async mget(keys) {
    try {
      const data = await redis.mget(keys);
      return data.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return [];
    }
  },

  // Set multiple keys
  async mset(keyValuePairs, ttl = 3600) {
    try {
      const pipeline = redis.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  },

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache clearPattern error:', error);
      return 0;
    }
  },

  // Hash operations
  async hset(key, field, value, ttl = null) {
    try {
      await redis.hset(key, field, JSON.stringify(value));
      if (ttl) {
        await redis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  },

  async hget(key, field) {
    try {
      const data = await redis.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  },

  async hgetall(key) {
    try {
      const data = await redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return {};
    }
  },

  // List operations
  async lpush(key, ...values) {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await redis.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Cache lpush error:', error);
      return 0;
    }
  },

  async lrange(key, start = 0, stop = -1) {
    try {
      const data = await redis.lrange(key, start, stop);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Cache lrange error:', error);
      return [];
    }
  },

  // Set operations
  async sadd(key, ...members) {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await redis.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error('Cache sadd error:', error);
      return 0;
    }
  },

  async smembers(key) {
    try {
      const data = await redis.smembers(key);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  },

  // Sorted set operations
  async zadd(key, score, member, ttl = null) {
    try {
      await redis.zadd(key, score, JSON.stringify(member));
      if (ttl) {
        await redis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error('Cache zadd error:', error);
      return false;
    }
  },

  async zrange(key, start = 0, stop = -1, withScores = false) {
    try {
      const args = withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop];
      const data = await redis.zrange(...args);
      
      if (withScores) {
        const result = [];
        for (let i = 0; i < data.length; i += 2) {
          result.push({
            member: JSON.parse(data[i]),
            score: parseFloat(data[i + 1]),
          });
        }
        return result;
      } else {
        return data.map(item => JSON.parse(item));
      }
    } catch (error) {
      logger.error('Cache zrange error:', error);
      return [];
    }
  },
};

// Session utilities
const session = {
  async create(sessionId, userId, data, ttl = 86400) { // 24 hours default
    try {
      const sessionData = {
        userId,
        ...data,
        createdAt: new Date(),
      };
      await cache.set(`session:${sessionId}`, sessionData, ttl);
      return true;
    } catch (error) {
      logger.error('Session create error:', error);
      return false;
    }
  },

  async get(sessionId) {
    try {
      return await cache.get(`session:${sessionId}`);
    } catch (error) {
      logger.error('Session get error:', error);
      return null;
    }
  },

  async update(sessionId, data, ttl = 86400) {
    try {
      const existingSession = await this.get(sessionId);
      if (existingSession) {
        const updatedSession = {
          ...existingSession,
          ...data,
          updatedAt: new Date(),
        };
        await cache.set(`session:${sessionId}`, updatedSession, ttl);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Session update error:', error);
      return false;
    }
  },

  async destroy(sessionId) {
    try {
      await cache.del(`session:${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Session destroy error:', error);
      return false;
    }
  },

  async refresh(sessionId, ttl = 86400) {
    try {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        await cache.set(`session:${sessionId}`, sessionData, ttl);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Session refresh error:', error);
      return false;
    }
  },
};

// Rate limiting utilities
const rateLimit = {
  async check(key, limit, window) {
    try {
      const current = await cache.incr(key, window);
      return {
        allowed: current <= limit,
        current,
        limit,
        remaining: Math.max(0, limit - current),
        resetTime: Date.now() + (window * 1000),
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      return { allowed: true, current: 0, limit, remaining: limit };
    }
  },
};

module.exports = {
  redis,
  redisPub,
  redisSub,
  connectRedis,
  closeRedis,
  cache,
  session,
  rateLimit,
};