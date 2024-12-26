import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../../../middleware/rateLimiter.js';
import logger from '../../../utils/logger.js';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    vi.clearAllMocks();
  });

  it('should allow requests within rate limit', async () => {
    const limiter = createRateLimiter({ windowMs: 15000, max: 2 });
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ message: 'success' }));

    // First request
    const response1 = await request(app).get('/');
    expect(response1.status).toBe(200);
    expect(response1.body).toEqual({ message: 'success' });

    // Second request
    const response2 = await request(app).get('/');
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual({ message: 'success' });
  });

  it('should block requests that exceed rate limit', async () => {
    const limiter = createRateLimiter({ windowMs: 15000, max: 1 });
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ message: 'success' }));

    // First request (should succeed)
    const response1 = await request(app).get('/');
    expect(response1.status).toBe(200);

    // Second request (should be blocked)
    const response2 = await request(app).get('/');
    expect(response2.status).toBe(429);
    expect(response2.body).toEqual({
      status: 'error',
      message: 'Too many requests, please try again later',
    });

    // Verify logging
    expect(logger.warn).toHaveBeenCalledWith(
      'Rate limit exceeded',
      expect.objectContaining({
        ip: expect.any(String),
        path: '/',
        headers: expect.any(Object),
      }),
    );
  });

  it('should respect custom error message', async () => {
    const customMessage = 'Custom rate limit message';
    const limiter = createRateLimiter({
      windowMs: 15000,
      max: 1,
      message: customMessage,
    });
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ message: 'success' }));

    // Exhaust the rate limit
    await request(app).get('/');
    const response = await request(app).get('/');

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      status: 'error',
      message: customMessage,
    });
  });

  it('should include rate limit headers', async () => {
    const limiter = createRateLimiter({ windowMs: 15000, max: 2 });
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ message: 'success' }));

    const response = await request(app).get('/');

    expect(response.headers).toHaveProperty('ratelimit-limit', '2');
    expect(response.headers).toHaveProperty('ratelimit-remaining', '1');
    expect(response.headers).toHaveProperty('ratelimit-reset');
  });

  it('should not include legacy rate limit headers', async () => {
    const limiter = createRateLimiter({ windowMs: 15000, max: 2 });
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ message: 'success' }));

    const response = await request(app).get('/');

    expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
    expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
    expect(response.headers).not.toHaveProperty('x-ratelimit-reset');
  });
});
