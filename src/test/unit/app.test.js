import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';

describe('App', () => {
  let app;

  beforeEach(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  describe('Middleware and Basic Setup', () => {
    it('should use security headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('x-xss-protection', '0');
    });

    it('should use CORS', async () => {
      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
    });

    it('should use compression', async () => {
      const response = await request(app).get('/').set('Accept-Encoding', 'gzip');

      expect(response.headers).toHaveProperty('vary', 'Accept-Encoding');
    });

    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
    });

    it('should parse URL-encoded bodies', async () => {
      const response = await request(app)
        .post('/')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('test=data');

      expect(response.status).toBe(404);
    });

    it('should serve static files', async () => {
      const response = await request(app).get('/test.txt');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });
  });

  describe('Routes', () => {
    it('should handle root route', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Welcome to the Express Server Template API',
      });
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown');
      expect(response.status).toBe(404);
    });
  });

  describe('Custom Routes', () => {
    it('should handle custom routes from options', async () => {
      const customApp = createApp({
        routes: [
          {
            path: '/custom',
            method: 'get',
            handler: (req, res) => res.json({ message: 'custom route' }),
          },
        ],
      });

      const response = await request(customApp).get('/custom');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'custom route' });
    });
  });

  describe('Error Handling', () => {
    it('should handle method not allowed', async () => {
      const response = await request(app).trace('/api');
      expect(response.status).toBe(405);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Method Not Allowed');
    });

    it('should handle uncaught errors', async () => {
      const customApp = createApp({
        routes: [
          {
            path: '/error',
            method: 'get',
            handler: () => {
              throw new Error('Test error');
            },
          },
        ],
      });

      const response = await request(customApp).get('/error');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply general rate limiting', async () => {
      const responses = await Promise.all(
        Array(5)
          .fill()
          .map(() => request(app).get('/')),
      );

      expect(responses[0].headers).toHaveProperty('ratelimit-limit');
      expect(responses[0].headers).toHaveProperty('ratelimit-remaining');
    });

    it('should apply API rate limiting', async () => {
      const responses = await Promise.all(
        Array(5)
          .fill()
          .map(() => request(app).get('/api')),
      );

      expect(responses[0].headers).toHaveProperty('ratelimit-limit');
      expect(responses[0].headers).toHaveProperty('ratelimit-remaining');
    });
  });

  describe('Response Time', () => {
    it('should include response time header', async () => {
      const response = await request(app).get('/');
      expect(response.headers).toHaveProperty('x-response-time');
      expect(response.headers['x-response-time']).toMatch(/^\d+\.\d+ms$/);
    });
  });
});
