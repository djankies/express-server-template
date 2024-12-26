import logger from '../utils/logger.js';
import onHeaders from 'on-headers';

/**
 * Middleware to measure and log HTTP request response times
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const responseTimeMiddleware = (req, res, next) => {
  const startTime = process.hrtime();

  onHeaders(res, () => {
    const diff = process.hrtime(startTime);
    const time = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
    res.setHeader('X-Response-Time', time + 'ms');

    // Log the response time
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: time,
    });
  });

  next();
};
