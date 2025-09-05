import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;
let isDbConnected = false;

// Initialize database connection with graceful error handling
try {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not found. Database functionality will be limited.");
    console.warn("   Some features may not work properly without a database connection.");
  } else {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
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