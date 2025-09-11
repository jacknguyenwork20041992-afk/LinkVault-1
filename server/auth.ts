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
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS required in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-domain support
      maxAge: sessionTtl,
    },
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
        console.log(`🔐 LOGIN ATTEMPT: email="${email}" password="${password ? '[REDACTED]' : 'undefined'}"`);
        
        if (!email || !password) {
          console.log(`❌ LOGIN FAILED: Missing credentials - email: ${!!email}, password: ${!!password}`);
          return done(null, false, { message: 'Email and password are required' });
        }
        
        try {
          console.log(`🔍 Looking up user by email: ${email}`);
          const user = await storage.getUserByEmail(email);
          if (!user) {
            console.log(`❌ LOGIN FAILED: User not found for email: ${email}`);
            return done(null, false, { message: "Email không tồn tại" });
          }

          console.log(`✅ User found: ${user.email} (${user.role}), isActive: ${user.isActive}`);
          
          if (!user.isActive) {
            console.log(`❌ LOGIN FAILED: User account is deactivated: ${email}`);
            return done(null, false, { message: "Tài khoản đã bị vô hiệu hóa" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password || "");
          if (!isValidPassword) {
            console.log(`❌ LOGIN FAILED: Invalid password for user: ${email}`);
            return done(null, false, { message: "Mật khẩu không đúng" });
          }

          console.log(`✅ LOGIN SUCCESS: ${user.email} authenticated successfully`);
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // User not found, clear the session
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      // Don't fail, just clear the session
      done(null, false);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Lỗi server" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Đăng nhập thất bại" });
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

        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Đăng xuất thành công" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
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