import { describe, expect, it, vi, beforeEach } from 'vitest';
import logger, { winstonLogger } from '../../../utils/logger.js';

// Mock winston
vi.mock('winston', () => ({
  default: {
    createLogger: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      http: vi.fn(),
      debug: vi.fn(),
    })),
    format: {
      timestamp: () => ({ transform: vi.fn() }),
      errors: () => ({ transform: vi.fn() }),
      simple: () => ({ transform: vi.fn() }),
      prettyPrint: () => ({ transform: vi.fn() }),
      json: () => ({ transform: vi.fn() }),
      combine: () => ({ transform: vi.fn() }),
      colorize: () => ({ transform: vi.fn() }),
      printf: () => ({ transform: vi.fn() }),
    },
    transports: {
      Console: vi.fn(),
    },
  },
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SILENT = 'false';
    process.env.LOG_ERRORS = 'true';
    process.env.LOG_REQUESTS = 'true';
    process.env.LOG_QUERIES = 'true';
    process.env.DEBUG_MODE = 'true';
  });

  it('should log errors when LOG_ERRORS is true', () => {
    const error = new Error('Test error');
    logger.error('Test error', { error });
    expect(winstonLogger.error).toHaveBeenCalledWith('Test error', { error });
  });

  it('should not log errors when LOG_ERRORS is false', () => {
    process.env.LOG_ERRORS = 'false';
    logger.error('Test error');
    expect(winstonLogger.error).not.toHaveBeenCalled();
  });

  it('should not log http when LOG_REQUESTS is false', () => {
    process.env.LOG_REQUESTS = 'false';
    logger.http('Test request');
    expect(winstonLogger.http).not.toHaveBeenCalled();
  });

  it('should not log queries when LOG_QUERIES is false', () => {
    process.env.LOG_QUERIES = 'false';
    logger.query('Test query');
    expect(winstonLogger.debug).not.toHaveBeenCalled();
  });

  it('should not log debug messages when DEBUG_MODE is false', () => {
    process.env.DEBUG_MODE = 'false';
    logger.debug('Test debug');
    expect(winstonLogger.debug).not.toHaveBeenCalled();
  });

  it('should not log anything when SILENT is true', () => {
    process.env.SILENT = 'true';

    logger.info('Test info');
    logger.error('Test error');
    logger.warn('Test warn');
    logger.http('Test request');
    logger.query('Test query');
    logger.debug('Test debug');

    expect(winstonLogger.info).not.toHaveBeenCalled();
    expect(winstonLogger.error).not.toHaveBeenCalled();
    expect(winstonLogger.warn).not.toHaveBeenCalled();
    expect(winstonLogger.http).not.toHaveBeenCalled();
    expect(winstonLogger.debug).not.toHaveBeenCalled();
  });

  describe('HTTP Logger Middleware', () => {
    it('should log HTTP requests', () => {
      const startTime = Date.now();
      const req = {
        method: 'GET',
        url: '/test',
        path: '/test',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' },
        query: {},
        body: {},
        _startTime: startTime,
      };
      const res = {
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'finish') callback();
        }),
      };
      const next = vi.fn();

      logger.httpLogger()(req, res, next);

      expect(winstonLogger.http).toHaveBeenCalledWith('HTTP Request', {
        req,
        duration: expect.any(Number),
        level: 'http',
      });
      expect(next).toHaveBeenCalled();
    });

    it('should not log HTTP requests when LOG_REQUESTS is false', () => {
      process.env.LOG_REQUESTS = 'false';
      const req = {};
      const res = { on: vi.fn() };
      const next = vi.fn();

      logger.httpLogger()(req, res, next);

      expect(winstonLogger.http).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
