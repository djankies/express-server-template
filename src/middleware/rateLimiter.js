import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Get rate limit settings from environment variables or use defaults
 * @returns {Object} Rate limit settings
 */
const getRateLimitSettings = () => ({
  api: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
  },
  auth: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5, // 5 requests per window
  },
  general: {
    windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // 1 minute
    max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX, 10) || 30, // 30 requests per window
  },
});

/**
 * Creates a rate limiter middleware with configurable options
 * @param {Object} options - Rate limiter options
 * @param {number} [options.windowMs=15 * 60 * 1000] - Time window in milliseconds
 * @param {number} [options.max=100] - Max number of requests per windowMs
 * @param {string} [options.message='Too many requests, please try again later'] - Error message
 * @returns {Function} Express middleware function
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        headers: req.headers,
      });
      res.status(429).json({
        status: 'error',
        message: options.message || 'Too many requests, please try again later',
      });
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Default rate limiter for API endpoints
export const apiLimiter = () => {
  const settings = getRateLimitSettings();
  return createRateLimiter({
    windowMs: settings.api.windowMs,
    max: settings.api.max,
  });
};

// More strict rate limiter for authentication endpoints
export const authLimiter = () => {
  const settings = getRateLimitSettings();
  return createRateLimiter({
    windowMs: settings.auth.windowMs,
    max: settings.auth.max,
    message: 'Too many login attempts, please try again later',
  });
};

// Rate limiter for general routes
export const generalLimiter = () => {
  const settings = getRateLimitSettings();
  return createRateLimiter({
    windowMs: settings.general.windowMs,
    max: settings.general.max,
  });
};

// Create rate limiter middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      headers: req.headers,
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
    });
  },
});
