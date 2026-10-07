import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');

const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  useMemoryDb: bool(process.env.USE_MEMORY_DB, false),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'cw_admin_token',
  // lax works when frontend + API share a site (or via proxy). Use "none" (requires HTTPS) for cross-site.
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  cookieSecure: bool(process.env.COOKIE_SECURE, isProd),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/$/, ''),
  serveFrontend: bool(process.env.SERVE_FRONTEND, false),
  frontendDist: path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
  adminSeed: {
    name: process.env.ADMIN_NAME || 'CHOLAN Admin',
    email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  },
};

if (!env.jwtSecret || env.jwtSecret.length < 32) {
  if (isProd) {
    console.error('FATAL: JWT_SECRET must be set (min 32 chars) in production.');
    process.exit(1);
  }
  // Dev only: ephemeral secret so a missing .env never means an insecure fixed secret.
  env.jwtSecret = `dev-${Math.random().toString(36).slice(2)}${Date.now()}-cholan-wear-secret`;
  console.warn('[env] JWT_SECRET missing/short - using an ephemeral dev secret (sessions reset on restart).');
}

export default env;
