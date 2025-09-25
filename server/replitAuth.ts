import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { storage } from "./storage";
import { pool } from "./db";

// Set default domain if not provided
if (!process.env.REPLIT_DOMAINS) {
  // Try to detect from hostname or use wildcard
  process.env.REPLIT_DOMAINS = "*.replit.dev";
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Resilient Session Store Wrapper Class
class ResilientSessionStore {
  private pgStore: any = null;
  private memoryStore: any;
  private useFallback = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30 seconds
  
  constructor(sessionTtl: number) {
    const MemoryStore = memorystore(session);
    this.memoryStore = new MemoryStore({ checkPeriod: sessionTtl });
    
    // Try to initialize PostgreSQL store
    if (pool) {
      try {
        const PgStore = connectPg(session);
        this.pgStore = new PgStore({
          pool: pool,
          createTableIfMissing: true, // Create table if missing
          ttl: sessionTtl,
          tableName: "sessions"
        });
        console.log("✅ Session store using PostgreSQL with shared pool");
        
        // Monitor pool health
        pool.on('error', (err: Error) => {
          console.error("⚠️  Database pool error, switching to memory fallback:", err.message);
          this.useFallback = true;
        });
        
      } catch (error) {
        console.error("⚠️  PostgreSQL session store failed, using memory store:", (error as Error).message);
        this.useFallback = true;
      }
    } else {
      console.warn("⚠️  No database pool available, using memory store for sessions");
      this.useFallback = true;
    }
  }
  
  // Health check to recover from fallback
  private async healthCheck() {
    if (!this.useFallback || Date.now() - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }
    
    this.lastHealthCheck = Date.now();
    try {
      if (pool) {
        await pool.query('SELECT 1');
        console.log("✅ Database recovered, switching back from memory fallback");
        this.useFallback = false;
      }
    } catch (error) {
      // Still unhealthy, keep using fallback
    }
  }
  
  // Resilient get operation
  get(sid: string, callback: (err?: any, session?: any) => void) {
    this.healthCheck();
    
    if (this.useFallback || !this.pgStore) {
      return this.memoryStore.get(sid, callback);
    }
    
    this.pgStore.get(sid, (err: any, session: any) => {
      if (err && this.isConnectionError(err)) {
        console.error("⚠️  Database connection error during session get, falling back to memory:", err.message);
        this.useFallback = true;
        return this.memoryStore.get(sid, callback);
      }
      callback(err, session);
    });
  }
  
  // Resilient set operation
  set(sid: string, session: any, callback?: (err?: any) => void) {
    this.healthCheck();
    
    if (this.useFallback || !this.pgStore) {
      return this.memoryStore.set(sid, session, callback);
    }
    
    this.pgStore.set(sid, session, (err: any) => {
      if (err && this.isConnectionError(err)) {
        console.error("⚠️  Database connection error during session set, falling back to memory:", err.message);
        this.useFallback = true;
        return this.memoryStore.set(sid, session, callback);
      }
      if (callback) callback(err);
    });
  }
  
  // Resilient destroy operation
  destroy(sid: string, callback?: (err?: any) => void) {
    this.healthCheck();
    
    if (this.useFallback || !this.pgStore) {
      return this.memoryStore.destroy(sid, callback);
    }
    
    this.pgStore.destroy(sid, (err: any) => {
      if (err && this.isConnectionError(err)) {
        console.error("⚠️  Database connection error during session destroy, falling back to memory:", err.message);
        this.useFallback = true;
        return this.memoryStore.destroy(sid, callback);
      }
      if (callback) callback(err);
    });
  }
  
  // Resilient touch operation
  touch(sid: string, session: any, callback?: (err?: any) => void) {
    this.healthCheck();
    
    if (this.useFallback || !this.pgStore || !this.pgStore.touch) {
      // Memory store doesn't have touch, use set
      return this.memoryStore.set(sid, session, callback);
    }
    
    this.pgStore.touch(sid, session, (err: any) => {
      if (err && this.isConnectionError(err)) {
        console.error("⚠️  Database connection error during session touch, falling back to memory:", err.message);
        this.useFallback = true;
        return this.memoryStore.set(sid, session, callback);
      }
      if (callback) callback(err);
    });
  }
  
  // Check if error is a connection-related error
  private isConnectionError(err: any): boolean {
    const connectionErrors = [
      'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 
      'ENOTFOUND', 'ENETUNREACH', '57P01'
    ];
    return connectionErrors.some(code => 
      err.code === code || err.message?.includes(code)
    );
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const resilientStore = new ResilientSessionStore(sessionTtl);
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: resilientStore as any, // Cast to session store interface
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: sessionTtl,
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  return await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    authProvider: "replit",
    role: "user", // Default role for new users
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const userSession = {};
    updateUserSession(userSession, tokens);
    const dbUser = await upsertUser(tokens.claims());
    verified(null, dbUser);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Additional check: Verify user is still active in database
    try {
      const dbUser = await storage.getUser(user.claims.sub);
      if (!dbUser || !dbUser.isActive) {
        return res.status(401).json({ message: "Account deactivated" });
      }
    } catch (error) {
      console.error("Error checking user active status:", error);
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    // Additional check: Verify user is still active in database after token refresh
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }
    
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    console.error("User claims:", user.claims);
    console.error("Refresh token exists:", !!refreshToken);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
