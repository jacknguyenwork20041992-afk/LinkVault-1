import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Skip Google Auth setup if credentials are not available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || 
      process.env.GOOGLE_CLIENT_ID === 'optional' || process.env.GOOGLE_CLIENT_SECRET === 'optional') {
    console.log('Google OAuth credentials not configured, skipping Google auth setup');
    return;
  }

  // Get the base URL for callback
  const getCallbackURL = (req: any) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers.host;
    return `${protocol}://${host}/api/auth/google/callback`;
  };

  // Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback" // This will be overridden by passReqToCallback
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName || "";
      const lastName = profile.name?.familyName || "";
      const profileImageUrl = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error("No email found from Google profile"));
      }

      // Check if user exists by Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Check if user exists by email
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Update existing user with Google ID
          user = await storage.updateUser(user.id, {
            googleId: profile.id,
            authProvider: "google",
            profileImageUrl: profileImageUrl || user.profileImageUrl,
          });
        } else {
          // Create new user
          user = await storage.createUser({
            email,
            firstName,
            lastName,
            profileImageUrl,
            googleId: profile.id,
            authProvider: "google",
            role: "user",
          });
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Google auth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/auth?error=google`
    }),
    (req, res) => {
      // Successful authentication, redirect to frontend domain.
      const frontendUrl = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000';
      res.redirect(frontendUrl);
    }
  );
}