import 'dotenv/config.js';
import winston from 'winston';

// Define colors for different log levels
const colors = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  http: '\x1b[35m', // Magenta
  debug: '\x1b[34m', // Blue
};

const reset = '\x1b[0m';

// Custom format for HTTP requests
const httpFormat = winston.format.printf(({ timestamp, req, duration, level }) => {
  const color = colors[level] || colors.info;

  if (!req) return ''; // Skip if not a request log

  const logFormat = {
    duration: duration || 0,
  };

  return `${color}[${timestamp}] ${req.method} ${req.url}${reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request Details:
• Path: ${req.path}
• Duration: ${logFormat.duration}
• IP: ${req.ip}

Headers:
${JSON.stringify(req.headers || {}, null, 2)}

Query Params:
${JSON.stringify(req.query || {}, null, 2)}

Body:
${JSON.stringify(req.body || {}, null, 2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
});

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.PRETTY_LOGGING === 'true' ? httpFormat : winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
  silent: process.env.SILENT === 'true',
});

// Create logger wrapper with environment variable controls
const logger = {
  error: (message, meta = {}) => {
    if (process.env.SILENT !== 'true' && process.env.LOG_ERRORS !== 'false') {
      winstonLogger.error(message, meta);
    }
  },

  warn: (message, meta = {}) => {
    if (process.env.SILENT !== 'true') {
      winstonLogger.warn(message, meta);
    }
  },

  info: (message, meta = {}) => {
    if (process.env.SILENT !== 'true') {
      winstonLogger.info(message, meta);
    }
  },

  http: (message, meta = {}) => {
    if (process.env.SILENT !== 'true' && process.env.LOG_REQUESTS !== 'false') {
      winstonLogger.http(message, meta);
    }
  },

  query: (message, meta = {}) => {
    if (process.env.SILENT !== 'true' && process.env.LOG_QUERIES !== 'false') {
      winstonLogger.debug(message, meta);
    }
  },

  debug: (message, meta = {}) => {
    if (process.env.SILENT !== 'true' && process.env.DEBUG_MODE === 'true') {
      winstonLogger.debug(message, meta);
    }
  },

  // HTTP request logger middleware
  httpLogger: () => {
    return (req, res, next) => {
      if (process.env.SILENT !== 'true' && process.env.LOG_REQUESTS !== 'false') {
        const startTime = Date.now();

        res.on('finish', () => {
          const duration = Date.now() - startTime;
          logger.http('HTTP Request', {
            req,
            duration,
            level: 'http',
          });
        });
      }
      next();
    };
  },
};

// Export both the logger wrapper and winston instance for testing
export { winstonLogger };
export default logger;
