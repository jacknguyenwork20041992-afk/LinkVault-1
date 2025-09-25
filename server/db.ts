import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: any = null;
let isDbConnected = false;

// Initialize database connection with graceful error handling
try {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not found. Database functionality will be limited.");
    console.warn("   Some features may not work properly without a database connection.");
  } else {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection settings optimized for Render Free Tier + Supabase pooler
      connectionTimeoutMillis: 15000, // 15 seconds timeout for IPv4 compatibility
      idleTimeoutMillis: 60000, // 60 seconds idle timeout (longer for sleep mode)
      max: 5, // reduced max connections for free tier (avoid overwhelming pooler)
      min: 0, // no min connections for sleep mode compatibility
      maxUses: 7500, // max uses per connection before refresh
      allowExitOnIdle: true, // allow pool to close when idle (important for sleep mode)
      // Additional settings for Render free tier sleep mode recovery
      query_timeout: 15000, // 15 second query timeout (longer for cold start)
      statement_timeout: 15000, // 15 second statement timeout
      // Sleep mode recovery settings
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    });
    db = drizzle(pool, { schema });
    isDbConnected = true;
    console.log("✅ Database connection initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize database connection:", error);
  console.warn("⚠️  Server will continue with limited functionality");
}

// Export database connection with null checks
export { pool, db, isDbConnected };

// Helper function to check if database is available
export function requireDatabase() {
  if (!isDbConnected || !db) {
    throw new Error("Database connection is not available. Please check your DATABASE_URL configuration.");
  }
  return db;
}

// Sleep mode recovery: reconnect database after instance wake up
export async function reconnectDatabase() {
  try {
    if (pool && db) {
      // Test connection with a simple query
      await pool.query('SELECT 1');
      console.log("✅ Database connection verified");
      return true;
    }
    return false;
  } catch (error) {
    console.warn("⚠️  Database connection lost, attempting to reconnect...");
    
    // Re-initialize connection
    try {
      if (pool) {
        await pool.end(); // Close existing pool
      }
      
      if (process.env.DATABASE_URL) {
        pool = new Pool({ 
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 60000,
          max: 5,
          min: 0,
          maxUses: 7500,
          allowExitOnIdle: true,
          query_timeout: 15000,
          statement_timeout: 15000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 0,
        });
        db = drizzle(pool, { schema });
        isDbConnected = true;
        console.log("✅ Database reconnected successfully after sleep mode");
        return true;
      }
    } catch (reconnectError) {
      console.error("❌ Failed to reconnect database:", reconnectError);
      isDbConnected = false;
    }
    return false;
  }
}

// Health check function for monitoring
export async function checkDatabaseHealth() {
  try {
    if (!pool) {
      return { status: 'error', message: 'Database pool not initialized' };
    }
    
    const start = Date.now();
    await pool.query('SELECT 1 as health_check');
    const duration = Date.now() - start;
    
    return { 
      status: 'healthy', 
      responseTime: `${duration}ms`,
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown database error' };
  }
}