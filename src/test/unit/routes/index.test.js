import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../../app.js';
import logger from '../../../utils/logger.js';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    httpLogger: () => (req, res, next) => next(),
  },
}));

describe('Index Routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Welcome to the Express Server Template API',
      });
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should log info message on root request', async () => {
      await request(app).get('/api');

      expect(logger.info).toHaveBeenCalledWith(
        'Handling root request',
        expect.objectContaining({
          query: {},
        }),
      );
    });

    it('should handle request with query parameters', async () => {
      const response = await request(app).get('/api').query({ test: 'value' });

      expect(response.status).toBe(200);
      expect(logger.warn).toHaveBeenCalledWith(
        'Query parameters detected',
        expect.objectContaining({
          params: { test: 'value' },
          warning: 'Unexpected query parameters',
        }),
      );
    });
  });

  describe('GET /error', () => {
    it('should handle errors properly', async () => {
      const response = await request(app).get('/api/error');

      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenNthCalledWith(
        1,
        'Test server error',
        expect.objectContaining({
          details: {
            code: 'TEST_ERROR',
            path: '/error',
          },
        }),
      );
    });
  });

  describe('Request Validation', () => {
    it('should validate JSON content type', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'text/plain')
        .send('Hello World');

      expect(response.status).toBe(415);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Unsupported Media Type',
      });
    });

    it('should accept URL-encoded data', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name=test');

      expect(response.status).toBe(404);
    });

    it('should handle method not allowed', async () => {
      const response = await request(app).patch('/api').set('Content-Type', 'application/json');

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Method Not Allowed',
      });
    });
  });
});
