import express from 'express';
import { testDatabaseConnection } from './lib/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } else {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API routes - these will be implemented as serverless functions in Vercel
// For local development, we import them here
app.get('/api/companies', async (req, res) => {
  const handler = (await import('../api/companies/index.js')).default;
  return handler(req, res);
});

app.post('/api/launch-posts', async (req, res) => {
  const handler = (await import('../api/launch-posts/index.js')).default;
  return handler(req, res);
});

app.post('/api/refresh/:id', async (req, res) => {
  req.query.id = req.params.id;
  const handler = (await import('../api/refresh/[id].js')).default;
  return handler(req, res);
});

app.post('/api/companies/:id/contact', async (req, res) => {
  req.query.id = req.params.id;
  const handler = (await import('../api/companies/[id]/contact.js')).default;
  return handler(req, res);
});

app.get('/api/export', async (req, res) => {
  const handler = (await import('../api/export/index.js')).default;
  return handler(req, res);
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
