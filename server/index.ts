import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { sessionService } from "./sessionService";

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION 🚨');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack');
});

// Uncaught exception handler  
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION 🚨');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
});

// Simple logging function for production
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// CORS configuration - Cho phép frontend kết nối
let allowedOrigins;
if (process.env.NODE_ENV === 'production') {
  // In production, require explicit ALLOWED_ORIGINS
  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable is required in production');
  }
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
} else {
  // Development fallback with broad patterns for ease of development
  allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',  // Dev frontend
        'http://localhost:5000',  // Dev backend
        'http://localhost:3000',  // Alternative dev port
        /^https:\/\/.*\.vercel\.app$/,  // Vercel domains (dev only)
        /^https:\/\/.*\.replit\.dev$/,  // Replit domains (dev only)
        /^https:\/\/.*\.kirk\.replit\.dev$/,  // Replit IDE domains (dev only)
      ];
}

// Secure CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) only in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin || '');
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Cho phép gửi cookies
}));

// Add request size limits and better error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware - only detailed logging in development
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Only detailed logging in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    
    // Only log body for POST/PUT/PATCH and if it's not too large
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const bodyStr = JSON.stringify(req.body);
      if (bodyStr.length < 500) {
        console.log(`📦 Body:`, req.body);
      } else {
        console.log(`📦 Body: [Large body ${bodyStr.length} chars]`);
      }
    }
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'production') {
      const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
      console.log(`${statusEmoji} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Only capture response body in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only include response body in development logs  
      if (process.env.NODE_ENV !== 'production' && capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Production-safe error logging
      if (process.env.NODE_ENV !== 'production') {
        // Detailed logging only in development
        console.error('=== DEVELOPMENT ERROR LOG ===');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Method:', req.method);
        console.error('URL:', req.originalUrl);
        console.error('Headers:', JSON.stringify(req.headers, null, 2));
        console.error('Body:', JSON.stringify(req.body, null, 2));
        console.error('Query:', JSON.stringify(req.query, null, 2));
        console.error('User:', req.user ? `${req.user.email} (${req.user.role})` : 'Not authenticated');
        console.error('Error Status:', status);
        console.error('Error Message:', message);
        console.error('Error Stack:', err.stack);
        console.error('===============================');
      } else {
        // Production: minimal logging without PII
        console.error('Production Error:', {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl,
          status,
          message: message,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }

      // Log short version for normal logging
      log(`ERROR ${status}: ${req.method} ${req.originalUrl} - ${message}`);

      // Send response
      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: err.stack,
          details: err 
        })
      });
    });

    // Only setup vite in development
    if (process.env.NODE_ENV === "development") {
      try {
        const { setupVite } = await import("./vite");
        await setupVite(app, server);
      } catch (e) {
        console.warn("Failed to setup Vite:", e);
      }
    }
    

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Start session management service
      try {
        sessionService.start();
      } catch (error) {
        console.error("⚠️ Failed to start session service:", error);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    
    // In production, still try to start a basic server to avoid complete failure
    if (process.env.NODE_ENV === "production") {
      try {
        const port = parseInt(process.env.PORT || '5000', 10);
        
        // Create a basic health check endpoint
        app.get("/health", (_req, res) => {
          res.status(503).json({ 
            status: "Service Unavailable", 
            message: "Server failed to initialize properly" 
          });
        });
        
        // Basic fallback for production
        
        app.listen(port, "0.0.0.0", () => {
          log(`⚠️  serving fallback server on port ${port} (initialization failed)`);
        });
      } catch (fallbackError) {
        console.error("❌ Failed to start fallback server:", fallbackError);
        process.exit(1);
      }
    } else {
      // In development, exit with error for debugging
      console.error("❌ Development server failed to start");
      process.exit(1);
    }
  }
})();
