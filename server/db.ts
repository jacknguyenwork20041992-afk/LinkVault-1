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
      // Connection timeout and pool settings optimized for Render + Supabase pooler
      connectionTimeoutMillis: 15000, // 15 seconds timeout for IPv4 compatibility
      idleTimeoutMillis: 30000, // 30 seconds idle timeout
      max: 10, // reduced max connections for pooler compatibility
      min: 1, // reduced min connections for free tier
      maxUses: 7500, // max uses per connection before refresh
      allowExitOnIdle: true, // allow pool to close when idle
      // Additional settings for better Render + Supabase compatibility
      query_timeout: 10000, // 10 second query timeout
      statement_timeout: 10000, // 10 second statement timeout
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