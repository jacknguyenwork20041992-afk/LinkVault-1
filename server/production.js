// Production server - redirect to full server
import express from 'express';

const app = express();

// Health check only - redirect to built server for full functionality
app.get('/api/health', (req, res) => {
  res.json({
    status: 'redirect_to_built_server',
    message: 'Use npm start instead of production.js for full functionality',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

app.get('*', (req, res) => {
  res.status(503).json({
    error: 'Service should use built server',
    message: 'Change start command to: npm start'
  });
});

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