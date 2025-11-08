import express from 'express';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'flight-schedule-pro-backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes (will be added as we build features)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Flight Schedule Pro API',
    version: '0.1.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api - API info'
    ]
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Backend development server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;



