// Production server without any complex dependencies
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Database connection (optional, will skip if fails)
let db = null;
try {
  if (process.env.DATABASE_URL) {
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('✅ Database connection initialized');
  }
} catch (e) {
  console.log('⚠️ Database connection skipped:', e.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    message: 'VIA English Academy Backend is running!'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Basic user endpoint simulation
app.get('/api/user', (req, res) => {
  res.status(401).json({ message: 'Authentication required' });
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 VIA English Academy Backend running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/api/health`);
});