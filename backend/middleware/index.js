import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import env from '../config/env.js';
import Admin from '../models/Admin.js';
import { ApiError, asyncHandler, isValidId } from '../utils/helpers.js';

/* ---------------- auth ---------------- */
export const signAdminToken = (admin) =>
  jwt.sign({ sub: String(admin._id), role: admin.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw new ApiError(401, 'Authentication required');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  const admin = await Admin.findById(payload.sub);
  if (!admin) throw new ApiError(401, 'Account no longer exists');
  req.admin = admin;
  next();
});

/* ---------------- validation ---------------- */
/** Validate+coerce req[source] with a zod schema; the parsed value replaces the original. */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      result.error.issues.forEach((i) => {
        const key = i.path.join('.') || '_';
        if (!fields[key]) fields[key] = i.message;
      });
      return next(new ApiError(400, 'Please correct the highlighted fields.', fields));
    }
    // req.query is a getter in Express 5, so store parsed query separately.
    if (source === 'query') req.validQuery = result.data;
    else req[source] = result.data;
    next();
  };

export const validateObjectId =
  (param = 'id') =>
  (req, _res, next) =>
    isValidId(req.params[param]) ? next() : next(new ApiError(400, 'Invalid id'));

/* ---------------- upload ---------------- */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Only JPG, PNG or WEBP images are allowed.'));
  },
});

/* ---------------- rate limits ---------------- */
const limiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

export const loginLimiter = limiter(15 * 60 * 1000, 10, 'Too many login attempts. Try again in 15 minutes.');
export const orderLimiter = limiter(60 * 60 * 1000, 30, 'Too many orders from this network. Please try again later.');
export const apiLimiter = limiter(60 * 1000, 300, 'Too many requests. Please slow down.');

/* ---------------- errors ---------------- */
export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `Image too large (max ${env.maxUploadMb}MB each).` : err.message;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `That ${field} is already in use.`;
    details = { [field]: message };
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value supplied';
  }

  if (status >= 500) {
    console.error('[error]', err);
    if (env.isProd) message = 'Something went wrong. Please try again.';
  }
  res.status(status).json({ message, ...(details ? { errors: details } : {}) });
};
