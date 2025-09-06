// Production server without any complex dependencies
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database connection (optional, will skip if fails)
let db = null;
try {
  if (process.env.DATABASE_URL) {
    db = new Pool({ connectionString: process.env.DATABASE_URL });
  }
} catch (e) {
  console.log('Database connection skipped:', e.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${port}`);
});