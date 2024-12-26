/**
 * Home controller
 */
import logger from '../utils/logger.js';

export const homeController = {
  /**
   * Handle root request
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @param {import('express').NextFunction} next - Express next function
   */
  getHome: (req, res, next) => {
    try {
      logger.info('Handling root request', {
        query: req.query,
        path: req.path,
        method: req.method,
      });

      // Validate query parameters
      if (Object.keys(req.query).length > 0) {
        logger.warn('Query parameters detected', {
          params: req.query,
          warning: 'Unexpected query parameters',
        });
      }

      // Log request headers for debugging
      logger.debug('Request headers', {
        headers: req.headers,
        cookies: req.cookies,
      });

      // Check accept header
      const acceptHeader = req.get('accept');
      if (acceptHeader && !acceptHeader.includes('application/json')) {
        logger.warn('Non-JSON accept header detected', {
          accept: acceptHeader,
        });
      }

      return res.json({
        status: 'success',
        message: 'Welcome to the Express Server Template API',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in home controller', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  },
};
