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
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
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
      secure: false, // Set to true in production with HTTPS
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
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Email không tồn tại" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password || "");
          if (!isValidPassword) {
            return done(null, false, { message: "Mật khẩu không đúng" });
          }

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

        // Track login activity
        try {
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
        } catch (activityError) {
          console.error("Error tracking login activity:", activityError);
          // Don't fail login if activity tracking fails
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

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
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