import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import designRoutes from './routes/design.routes.js';
import orderRoutes from './routes/order.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { notFoundMiddleware } from './middleware/not-found.js';
import { errorMiddleware } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 204
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300
  })
);
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.originalUrl === '/api/orders/webhook') {
    return next();
  }

  return express.json({ limit: '8mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'threadforge-api',
    db: { readyState: mongoose.connection.readyState }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
