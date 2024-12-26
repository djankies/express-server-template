import express from 'express';
import { homeController } from '../controllers/homeController.js';
import { validateRequest } from '../utils/http.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Log all requests
router.use(logger.httpLogger());

// Validate content type for POST/PUT/PATCH requests
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type') || '';
    if (
      contentType.includes('application/json') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      next();
    } else {
      logger.error('Error: Unsupported Media Type');
      return res.status(415).json({
        status: 'error',
        message: 'Unsupported Media Type',
      });
    }
  } else {
    next();
  }
});

// Method not allowed handler
router.use((req, res, next) => {
  if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'].includes(req.method)) {
    logger.error('Error: Method Not Allowed');
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed',
    });
  }
  next();
});

// Home route
router.get('/', validateRequest, homeController.getHome);

// Test error route
router.get('/error', (_req, _res) => {
  logger.error('Test server error', {
    details: {
      code: 'TEST_ERROR',
      path: '/error',
    },
  });
  throw new Error('Test server error');
});

export default router;
