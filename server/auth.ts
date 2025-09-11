import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import type { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      password: string | null;
      role: string;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

export function setupAuth(app: Express) {
  const sessionTtl = 72 * 60 * 60 * 1000; // 72 hours (3 days) - require re-login after this
  
  // Environment-aware session store
  let sessionStore;
  if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.log('🗄️ Using PostgreSQL session store for production');
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Enable auto-creation for production
      ttl: Math.floor(sessionTtl / 1000), // Convert milliseconds to seconds for PG store
      tableName: "sessions",
      pruneSessionInterval: 60 * 60, // Clean up expired sessions every hour
    });
  } else {
    console.log('💾 Using MemoryStore for development (sessions will not persist across restarts)');
    sessionStore = new session.MemoryStore();
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure cookies only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-domain support for production
      maxAge: sessionTtl,
    },
    name: 'via.sid',
    rolling: true, // Reset expiry on each request
    proxy: process.env.NODE_ENV === 'production', // Trust proxy headers in production
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // IMPORTANT: Frontend must send 'email' field, not 'username'
        passwordField: "password",
      },
      async (email, password, done) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔐 LOGIN ATTEMPT: email="${email}" password="${password ? '[REDACTED]' : 'undefined'}"`);
        }
        
        if (!email || !password) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`❌ LOGIN FAILED: Missing credentials - email: ${!!email}, password: ${!!password}`);
          }
          return done(null, false, { message: 'Email and password are required' });
        }
        
        try {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🔍 Looking up user by email: ${email}`);
          }
          const user = await storage.getUserByEmail(email);
          if (!user) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`❌ LOGIN FAILED: User not found for email: ${email}`);
            }
            return done(null, false, { message: "Email không tồn tại" });
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ User found: ${user.email} (${user.role}), isActive: ${user.isActive}`);
          }
          
          if (!user.isActive) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`❌ LOGIN FAILED: User account is deactivated: ${email}`);
            }
            return done(null, false, { message: "Tài khoản đã bị vô hiệu hóa" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password || "");
          if (!isValidPassword) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`❌ LOGIN FAILED: Invalid password for user: ${email}`);
            }
            return done(null, false, { message: "Mật khẩu không đúng" });
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ LOGIN SUCCESS: ${user.email} authenticated successfully`);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 SERIALIZING USER: ${user.email} (${user.id})`);
    }
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 DESERIALIZING USER: ${id}`);
      }
      const user = await storage.getUser(id);
      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`❌ DESERIALIZE FAILED: User not found for ID: ${id}`);
        }
        return done(null, false);
      }
      
      if (!user.isActive) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`❌ DESERIALIZE FAILED: User account is deactivated: ${user.email}`);
        }
        return done(null, false);
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ DESERIALIZE SUCCESS: ${user.email} (${user.role})`);
      }
      done(null, user);
    } catch (error) {
      console.error("❌ Error deserializing user:", error);
      // Don't fail, just clear the session
      done(null, false);
    }
  });

  // Login route with session fixation protection
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Lỗi server" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Đăng nhập thất bại" });
      }
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Lỗi tạo session" });
        }
        
        req.logIn(user, async (err) => {
          if (err) {
            return res.status(500).json({ message: "Lỗi đăng nhập" });
          }

        // Track login time and activity (production-safe)
        try {
          if (storage.updateUserLastLogin && typeof storage.updateUserLastLogin === 'function') {
            await storage.updateUserLastLogin(user.id);
          }
          if (storage.createActivity && typeof storage.createActivity === 'function') {
            await storage.createActivity({
              userId: user.id,
              type: "login",
              description: `Người dùng ${user.firstName} ${user.lastName} đã đăng nhập`,
              metadata: {
                email: user.email,
                role: user.role,
              },
              ipAddress: req.ip || req.connection?.remoteAddress || null,
              userAgent: req.get('User-Agent') || null,
            });
          }
        } catch (activityError) {
          console.error("Error tracking login activity (non-critical):", activityError);
          // Don't fail login if activity tracking fails - production safety
        }

          // Return sanitized user without password hash
          const { password, ...safeUser } = user;
          return res.json(safeUser);
        });
      });
    })(req, res, next);
  });

  // Logout route with proper session cleanup
  app.post("/api/logout", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const sessionOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    } as const;

    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Lỗi đăng xuất" });
      }
      
      // Destroy session and clear cookie
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Lỗi đăng xuất" });
        }
        
        // Clear the session cookie
        res.clearCookie('via.sid', sessionOpts);
        res.json({ message: "Đăng xuất thành công" });
      });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Return sanitized user without password hash
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });
}

// Enhanced authentication middleware with activity tracking
export async function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = req.user;
    
    // Check if user is still active in database
    const dbUser = await storage.getUser(user.id);
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ 
        message: "Account has been deactivated",
        requireReactivation: true 
      });
    }

    // Check if user needs to re-login (72 hours)
    const now = new Date();
    const maxSessionAge = 72 * 60 * 60 * 1000; // 72 hours in ms
    
    if (dbUser.lastLoginAt) {
      const timeSinceLogin = now.getTime() - new Date(dbUser.lastLoginAt).getTime();
      if (timeSinceLogin > maxSessionAge) {
        return res.status(401).json({ 
          message: "Session expired. Please login again.",
          requireReLogin: true 
        });
      }
    }

    // Update last activity time (throttle to avoid too many DB calls)
    const shouldUpdateActivity = !dbUser.lastActiveAt || 
      (now.getTime() - new Date(dbUser.lastActiveAt).getTime()) > 5 * 60 * 1000; // 5 minutes
    
    if (shouldUpdateActivity) {
      try {
        if (storage.updateUserLastActivity && typeof storage.updateUserLastActivity === 'function') {
          await storage.updateUserLastActivity(user.id);
        }
      } catch (error) {
        console.error("Error updating user activity (non-critical):", error);
        // Don't fail request if activity tracking fails - production safety
      }
    }

    next();
  } catch (error) {
    console.error("Error in isAuthenticated middleware:", error);
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

// Admin middleware
export async function isAdmin(req: any, res: any, next: any) {
  try {
    let userId;
    let user;
    
    // Get user ID from either auth system
    if (req.user?.claims?.sub) {
      userId = req.user.claims.sub;
      user = await storage.getUser(userId);
    } else if (req.user?.id) {
      userId = req.user.id;
      user = req.user; // Local auth already has full user data
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Error checking admin status" });
  }
}