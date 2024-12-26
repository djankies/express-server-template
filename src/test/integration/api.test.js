import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';

describe('API Integration Tests', () => {
  let app;
  let originalEnv;

  beforeAll(() => {
    // Store original environment
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('Environment Configuration', () => {
    it('should use default port when PORT is not set', () => {
      delete process.env.PORT;
      const defaultPort = 3000;
      expect(process.env.PORT || defaultPort).toBe(defaultPort);
    });

    it('should use custom port when PORT is set', () => {
      process.env.PORT = '4000';
      expect(process.env.PORT).toBe('4000');
    });

    it('should handle NODE_ENV configuration', () => {
      process.env.NODE_ENV = 'production';
      expect(process.env.NODE_ENV).toBe('production');
    });
  });

  describe('Middleware', () => {
    let testApp;

    beforeEach(() => {
      testApp = createApp({
        routes: [
          {
            path: '/api/large',
            method: 'get',
            handler: (_req, res) => {
              res.send('x'.repeat(1024)); // 1KB response
            },
          },
        ],
      });
    });

    it('should handle CORS with various methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

      for (const method of methods) {
        const response = await request(testApp)
          .options('/api')
          .set('Origin', 'http://example.com')
          .set('Access-Control-Request-Method', method);

        expect(response.headers['access-control-allow-origin']).toBe('*');
        if (method !== 'OPTIONS') {
          expect(response.headers['access-control-allow-methods']).toContain(method);
        }
      }
    });

    it('should compress responses', async () => {
      const largeData = 'x'.repeat(10000);

      const testApp = createApp({
        routes: [
          {
            path: '/api/large',
            method: 'get',
            handler: (_req, res) => {
              res.type('text/plain');
              res.send(largeData);
            },
          },
        ],
      });

      const response = await request(testApp).get('/api/large').set('Accept-Encoding', 'gzip');

      expect(response.headers['vary']).toContain('Accept-Encoding');
      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should include comprehensive security headers', async () => {
      const response = await request(app).get('/api');

      // Helmet default headers
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    });

    it('should handle cookies', async () => {
      const testApp = createApp({
        routes: [
          {
            path: '/api/cookie',
            method: 'get',
            handler: (_req, res) => {
              res.cookie('test', 'value', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
              });
              res.json({ success: true });
            },
          },
        ],
      });

      const response = await request(testApp).get('/api/cookie');

      expect(response.headers['set-cookie']).toBeDefined();
      const cookie = response.headers['set-cookie'][0];
      expect(cookie).toContain('test=value');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
    });

    it('should parse JSON bodies with UTF-8 characters', async () => {
      const testApp = createApp({
        routes: [
          {
            path: '/api/echo',
            method: 'post',
            handler: (req, res) => {
              res.json(req.body);
            },
          },
        ],
      });

      const testData = { test: '你好, world! 🌍' };
      const response = await request(testApp).post('/api/echo').send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(testData);
    });

    it('should handle multiple URL-encoded arrays', async () => {
      const testApp = createApp({
        routes: [
          {
            path: '/api/echo',
            method: 'post',
            handler: (req, res) => {
              res.json(req.body);
            },
          },
        ],
      });

      const response = await request(testApp)
        .post('/api/echo')
        .type('form')
        .send('items[]=1&items[]=2&items[]=3');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: ['1', '2', '3'],
      });
    });
  });

  describe('Static File Serving', () => {
    const testFile = '/test.txt';
    let app;

    beforeEach(async () => {
      app = await createApp();
    });

    it('should serve static files with correct content type', async () => {
      await request(app)
        .get(testFile)
        .expect('Content-Type', /text\/plain/)
        .expect(200);
    });

    it('should handle conditional requests', async () => {
      const response = await request(app).get(testFile);
      const etag = response.headers.etag;

      await request(app).get(testFile).set('If-None-Match', etag).expect(304).expect('ETag', etag);
    });

    it('should handle range requests', async () => {
      const response = await request(app).get(testFile).set('Range', 'bytes=0-4');
      expect(response.status).toBe(206);
      expect(response.text).toBe('Hello');
      expect(response.headers['content-range']).toMatch(/^bytes 0-4\/\d+$/);
    });
  });

  describe('API Endpoints', () => {
    let app;

    beforeEach(() => {
      app = createApp();
    });

    describe('GET /api', () => {
      it('should return welcome message', async () => {
        const response = await request(app).get('/api');
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'success',
          message: 'Welcome to the Express Server Template API',
        });
        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should handle query parameters with special characters', async () => {
        const response = await request(app).get('/api').query({ 'special!@#': 'value!@#' });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'success',
          message: 'Welcome to the Express Server Template API',
        });
        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('GET /api/error', () => {
      it('should handle server errors with stack in development', async () => {
        process.env.NODE_ENV = 'development';
        const response = await request(app).get('/api/error');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('stack');
        expect(response.body).toMatchObject({
          status: 'error',
          message: 'Test server error',
        });
      });

      it('should not expose stack trace in production', async () => {
        process.env.NODE_ENV = 'production';
        const response = await request(app).get('/api/error');

        expect(response.status).toBe(500);
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).toMatchObject({
          status: 'error',
          message: 'Test server error',
        });
      });
    });
  });

  describe('Error Handling', () => {
    let app;

    beforeEach(() => {
      app = createApp();
    });

    it('should handle 404 errors', async () => {
      const response = await request(app).get('/api/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Not Found',
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send('{malformed:json}');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('JSON'),
      });
    });

    it('should handle payload too large', async () => {
      const largePayload = 'x'.repeat(1024 * 1024); // 1MB
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ data: largePayload }));

      expect(response.status).toBe(413);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('large'),
      });
    });

    it('should handle unsupported media types', async () => {
      const response = await request(app)
        .post('/api')
        .set('Content-Type', 'text/plain')
        .send('Hello World');

      expect(response.status).toBe(415);
      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Unsupported Media Type',
      });
    });

    it('should handle method not allowed', async () => {
      const response = await request(app).patch('/api').set('Content-Type', 'application/json');

      expect(response.status).toBe(405);
      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Method Not Allowed',
      });
    });
  });

  describe('Rate Limiting', () => {
    let app;
    let originalEnv;

    beforeEach(() => {
      // Store original environment
      originalEnv = { ...process.env };

      // Set rate limiting env vars before creating app with higher thresholds
      process.env.GENERAL_RATE_LIMIT_MAX = '5';
      process.env.GENERAL_RATE_LIMIT_WINDOW_MS = '5000';
      process.env.API_RATE_LIMIT_MAX = '5';
      process.env.API_RATE_LIMIT_WINDOW_MS = '5000';

      app = createApp();
    });

    afterEach(() => {
      // Restore original environment
      process.env = { ...originalEnv };
    });

    it('should apply API rate limits', async () => {
      // Make requests with delay to ensure proper rate limiting
      const makeRequest = () => request(app).get('/api');

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await makeRequest();
        expect(response.status).toBe(200);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Sixth request should be rate limited
      const response = await makeRequest();
      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Too many requests, please try again later',
      });

      // Wait for rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Should be able to make request again
      const finalResponse = await makeRequest();
      expect(finalResponse.status).toBe(200);
    }, 20000);
  });

  describe('Performance', () => {
    let app;

    beforeEach(() => {
      // Disable rate limiting for performance tests
      app = createApp({
        routes: [
          {
            path: '/api/concurrent',
            method: 'get',
            handler: (_req, res) => {
              res.json({ message: 'Success' });
            },
          },
          {
            path: '/api/delay',
            method: 'get',
            handler: async (_req, res) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              res.json({ message: 'Success' });
            },
          },
        ],
      });
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;

      const promises = Array(concurrentRequests)
        .fill()
        .map(() => request(app).get('/api/concurrent'));

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      await request(app).get('/api/delay');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500); // Response should be under 500ms
    });
  });
});
