import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { config } from './lib/config';
import { prisma } from './lib/db';
import { errorHandler } from './lib/http';
import { optionalAuth } from './lib/auth';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import offerRoutes from './routes/offers';
import conversationRoutes from './routes/conversations';
import userRoutes from './routes/users';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import miscRoutes from './routes/misc';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
if (!config.isProd) app.use(morgan('dev'));

fs.mkdirSync(config.uploadDir, { recursive: true });
app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true, fallthrough: false }));

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: config.isProd ? 300 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too_many_requests' },
  }),
);
app.use('/api', optionalAuth);

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, time: new Date().toISOString() });
});

const v1 = express.Router();
v1.use('/auth', authRoutes);
v1.use('/listings', listingRoutes);
v1.use('/offers', offerRoutes);
v1.use('/conversations', conversationRoutes);
v1.use('/users', userRoutes);
v1.use('/wallet', walletRoutes);
v1.use('/admin', adminRoutes);
v1.use('/', miscRoutes);
v1.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use('/api/v1', v1);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Dəyiş API işləyir: http://localhost:${config.port}`);
});
