import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import RateLimit from 'express-rate-limit';
import {
  apiLimiter,
  errorHandler,
  generalLimiter,
  methodNotAllowedHandler,
  notFoundHandler,
  responseTimeMiddleware,
} from './middleware/index.js';
import healthRouter from './routes/health.js';
import indexRouter from './routes/index.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // eslint-disable-line no-unused-vars

export function createApp(options = {}) {
  const app = express();

  // Middleware
  app.use(responseTimeMiddleware); // Add response time tracking
  app.use(logger.httpLogger());
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files first, before rate limiting
  const staticDir =
    process.env.NODE_ENV === 'test'
      ? join(process.cwd(), 'test-public')
      : join(process.cwd(), 'public');

  // Custom middleware for handling range requests and conditional gets
  const fileAccessLimiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
  });

  app.use(fileAccessLimiter, async (req, res, next) => {
    const filePath = join(staticDir, req.path.replace(/^\//, ''));

    try {
      const stat = await fs.promises.stat(filePath);
      const etag = `W/"${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}"`;
      res.set('ETag', etag);

      // Handle conditional requests
      if (req.headers['if-none-match'] === etag) {
        res.status(304);
        res.end();
        return;
      }

      // Handle range requests
      if (req.headers.range) {
        const range = req.headers.range;
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;

        if (start >= stat.size || end >= stat.size) {
          res.status(416).send('Requested range not satisfiable');
          return;
        }

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'text/plain',
        });

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
        return;
      }

      // For non-range requests, continue to next middleware
      next();
    } catch (err) {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    }
  });

  // Serve static files with proper headers for caching
  app.use(
    express.static(staticDir, {
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set content type to text/plain for all files in test-public
        if (path.includes('test-public')) {
          res.setHeader('Content-Type', 'text/plain');
        }

        // Set cache control headers
        res.setHeader('Cache-Control', 'no-cache');

        // Enable range requests
        res.setHeader('Accept-Ranges', 'bytes');
      },
    }),
  );

  // Rate limiting
  app.use('/', generalLimiter()); // General rate limiting for all routes
  app.use('/api', apiLimiter()); // Stricter limits for API endpoints

  // Routes
  app.use('/api', indexRouter);
  app.use('/health', healthRouter);

  // Custom routes (for testing)
  if (options.routes) {
    options.routes.forEach(route => {
      const { path, handler, method = 'use' } = route;
      app[method](path, handler);
    });
  }

  // Method not allowed handler
  app.use('/api', methodNotAllowedHandler);

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use(notFoundHandler);

  return app;
}

// Only create and start the server if this is the main module and not in test environment
if (import.meta.url === `file://${process.argv[1]}` && process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  const startServer = () => {
    return new Promise((resolve, reject) => {
      try {
        const server = app.listen(PORT, () => {
          console.info(`\x1b[32m✓ Server is listening on port ${PORT}\x1b[0m`);
          resolve(server);
        });

        server.on('error', error => {
          console.error('\x1b[31m✗ Failed to start server:\x1b[0m', error);
          reject(error);
        });
      } catch (error) {
        console.error('\x1b[31m✗ Failed to start server:\x1b[0m', error);
        reject(error);
      }
    });
  };

  try {
    const server = await startServer();

    // Perform initial health check
    const waitForHealthy = (await import('./utils/startupHealthCheck.js')).default;
    const isHealthy = await waitForHealthy('Express Server');

    if (!isHealthy) {
      console.error('\x1b[31m✗ Server failed initial health check\x1b[0m');
      server.close();
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }

    console.info('\x1b[32m✓ Server is ready to accept connections\x1b[0m');
  } catch (error) {
    console.error('\x1b[31m✗ Server startup failed:\x1b[0m', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }

  // Handle uncaught errors gracefully
  const handleFatalError = (err, type) => {
    logger.error(`${type}:`, { error: err.message, stack: err.stack });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  };

  process.on('unhandledRejection', err => handleFatalError(err, 'Unhandled rejection'));
  process.on('uncaughtException', err => handleFatalError(err, 'Uncaught exception'));
}

export default createApp;
