import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

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

// CORS configuration - Secure whitelist approach
// Secure CORS origins - only allow specific domains
const corsOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',  // Dev frontend
      'http://localhost:5000',  // Same origin for Replit
      'https://f8d286cb-c19d-43ef-aa57-9e8be0444613-00-3pu2wdcb3e78w.kirk.replit.dev', // Current Replit domain
      process.env.REPL_ID ? `https://${process.env.REPL_ID}.replit.dev` : null, // Current Replit dev URL
      process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER || 'default'}.replit.app` : null, // Current Replit app URL
    ].filter(Boolean); // Remove null values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list (all are strings now)
    const isAllowed = corsOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      log(`CORS blocked request from origin: ${origin}`, 'security');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow cookies but with secure origin checking
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log error messages in production, not full response bodies
      if (capturedJsonResponse && (res.statusCode >= 400 || process.env.NODE_ENV === 'development')) {
        // Only log message field, not sensitive data
        const safeLog = capturedJsonResponse.message ? { message: capturedJsonResponse.message } : {};
        logLine += ` :: ${JSON.stringify(safeLog)}`;
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

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error for debugging but don't throw it to prevent uncaught exceptions
      log(`Error handling request: ${message}`);
      console.error(err);

      res.status(status).json({ message });
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
