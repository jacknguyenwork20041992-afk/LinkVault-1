// Redis Session Store Alternative for Render Free Tier
// Use this if PostgreSQL sessions are causing issues with sleep mode

// Import types to fix TypeScript errors
import type { RedisClientType } from 'redis';
import type { SessionData, Store } from 'express-session';

// Note: Install these packages if using Redis:
// npm install redis connect-redis
// Uncomment imports when packages are installed:
// import { createClient } from 'redis';
// import connectRedis from 'connect-redis';
// import session from 'express-session';

// Redis configuration for external providers
const REDIS_PROVIDERS = {
  upstash: {
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  },
  render: {
    url: process.env.RENDER_REDIS_URL,
  },
  redis_cloud: {
    url: process.env.REDIS_CLOUD_URL,
  }
};

let redisClient: any = null;
let RedisStore: any = null;

export async function createRedisSessionStore(): Promise<any | null> {
  try {
    // Check which Redis provider is available
    let redisUrl = null;
    let providerName = 'none';
    
    if (REDIS_PROVIDERS.upstash.url) {
      redisUrl = REDIS_PROVIDERS.upstash.url;
      providerName = 'Upstash';
    } else if (REDIS_PROVIDERS.render.url) {
      redisUrl = REDIS_PROVIDERS.render.url;
      providerName = 'Render Redis';
    } else if (REDIS_PROVIDERS.redis_cloud.url) {
      redisUrl = REDIS_PROVIDERS.redis_cloud.url;
      providerName = 'Redis Cloud';
    }
    
    if (!redisUrl) {
      console.warn("⚠️  No Redis provider configured. Session storage will fall back to PostgreSQL.");
      return null;
    }

    // Create Redis client (uncomment when redis package is installed)
    /* redisClient = createClient({
      url: redisUrl,
      // Upstash specific configuration
      ...(providerName === 'Upstash' && REDIS_PROVIDERS.upstash.token ? {
        password: REDIS_PROVIDERS.upstash.token,
        socket: {
          tls: true,
        }
      } : {}),
      // Connection timeout and retry settings for Render Free Tier
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        reconnectDelay: 5000,
      },
      // Retry strategy for sleep mode recovery
      retry_strategy: (options: any) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.log('⚠️  Redis server connection refused.');
        }
        if (options.times_connected > 10) {
          console.log('❌ Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        // Reconnect after delay
        return Math.min(options.attempt * 100, 3000);
      }
    }); */

    // Connect to Redis (uncomment when redis package is installed)
    /* await redisClient.connect();
    console.log(`✅ Redis connected successfully using ${providerName}`);

    // Initialize Redis store
    RedisStore = connectRedis(session);
    
    const sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'via-session:',
      ttl: 7 * 24 * 60 * 60, // 1 week TTL
      // Handle Redis connection errors gracefully
      logErrors: true,
    });

    // Redis error handling
    redisClient.on('error', (err: Error) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Client Ready');
    });

    redisClient.on('end', () => {
      console.log('🔚 Redis Client Connection Ended');
    }); */

    // For now, return null until Redis packages are installed
    console.log("📝 Redis session store is available but requires 'redis' and 'connect-redis' packages");
    return null;

  } catch (error) {
    console.error('❌ Failed to create Redis session store:', error);
    console.warn('⚠️  Falling back to PostgreSQL session storage');
    return null;
  }
}

// Health check for Redis
export async function checkRedisHealth() {
  try {
    if (!redisClient) {
      return { status: 'not_configured', message: 'Redis client not initialized' };
    }
    
    const start = Date.now();
    await redisClient.ping();
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
      provider: getRedisProvider()
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Redis health check failed'
    };
  }
}

function getRedisProvider(): string {
  if (REDIS_PROVIDERS.upstash.url) return 'Upstash';
  if (REDIS_PROVIDERS.render.url) return 'Render Redis';  
  if (REDIS_PROVIDERS.redis_cloud.url) return 'Redis Cloud';
  return 'Unknown';
}

// Graceful shutdown
export async function closeRedisConnection() {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
}

/* 
SETUP INSTRUCTIONS FOR RENDER:

1. **Upstash (Recommended - Free tier available):**
   Environment Variables:
   - UPSTASH_REDIS_URL=rediss://[username]:[password]@[endpoint]:6380
   - UPSTASH_REDIS_TOKEN=[token]

2. **Render Redis (Paid service):**
   Environment Variables:
   - RENDER_REDIS_URL=redis://[user]:[password]@[host]:6379

3. **Redis Cloud (Free tier available):**
   Environment Variables:
   - REDIS_CLOUD_URL=redis://[user]:[password]@[host]:port

4. **To enable Redis sessions in auth.ts:**
   ```typescript
   import { createRedisSessionStore } from './redisSessionStore';
   
   // In setupAuth function, replace PostgreSQL store:
   const redisStore = await createRedisSessionStore();
   const sessionStore = redisStore || pgSessionStore; // Fallback to PG
   ```

Benefits for Render Free Tier:
- Faster session access (no DB connection needed)
- Better sleep mode recovery (Redis handles reconnection)
- Reduced database load
- External Redis services handle clustering and persistence
*/