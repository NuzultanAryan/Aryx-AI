import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import apiRoutes from './routes/api.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to load freely during development
}));

// CORS
app.use(cors({
  origin: config.frontendOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));

// Rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: config.limits.rateLimitMaxRequests,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/chat', chatLimiter);

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Global error handler — never exposes stack traces
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
