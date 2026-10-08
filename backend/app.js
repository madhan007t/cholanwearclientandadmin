import fs from 'fs';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { apiLimiter, errorHandler, notFound } from './middleware/index.js';

const app = express();
app.disable('x-powered-by');
if (env.isProd) app.set('trust proxy', 1); // correct client IPs behind a reverse proxy (rate limiting)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the SPA (other origin) to load /uploads images
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null, // HTTPS redirect is the reverse proxy / host's job
      },
    },
  })
);
app.use(
  cors((req, cb) => {
    const origin = req.header('Origin');
    let sameHost = false;
    try { sameHost = !!origin && new URL(origin).host === req.header('Host'); } catch { /* malformed origin */ }
    // Allowed: no Origin (curl/server-to-server), configured frontends, or the API's own host.
    const devLocal = !env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const allowed = !origin || sameHost || devLocal || env.clientOrigins.includes(origin);
    if (allowed) return cb(null, { origin: true, credentials: true });
    const err = new Error('Origin not allowed');
    err.status = 403;
    return cb(err);
  })
);
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/uploads', express.static(env.uploadDir, { maxAge: env.isProd ? '30d' : 0, index: false, dotfiles: 'deny' }));
// Every API request waits for the database (a no-op once connected) - required on serverless hosts.
app.use('/api', async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    res.status(503).json({ message: 'The store is temporarily unavailable. Please try again in a moment.' });
  }
});
app.use('/api', apiLimiter, routes);
app.use('/api', notFound);

// Optional: serve the built React app from the same server (single-service deployment).
if (env.serveFrontend && fs.existsSync(path.join(env.frontendDist, 'index.html'))) {
  app.use(express.static(env.frontendDist, { maxAge: '7d', index: false }));
  app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(env.frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
