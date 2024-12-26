import { describe, expect, it, vi } from 'vitest';
import { homeController } from '../../../controllers/homeController.js';
import logger from '../../../utils/logger.js';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('homeController', () => {
  describe('getHome', () => {
    // Reset mocks before each test
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return success response with timestamp', () => {
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {},
        cookies: {},
        get: () => 'application/json',
      };
      const res = {
        json: vi.fn(),
      };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Welcome to the Express Server Template API',
        timestamp: expect.any(String),
      });

      expect(logger.info).toHaveBeenCalledWith('Handling root request', {
        query: {},
        path: '/',
        method: 'GET',
      });

      expect(logger.debug).toHaveBeenCalledWith('Request headers', {
        headers: {},
        cookies: {},
      });

      // Verify timestamp format
      const response = res.json.mock.calls[0][0];
      expect(() => new Date(response.timestamp)).not.toThrow();
    });

    it('should log warning when query parameters are present', () => {
      const req = {
        query: { test: 'value' },
        path: '/',
        method: 'GET',
        headers: {},
        cookies: {},
        get: () => 'application/json',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Query parameters detected', {
        params: { test: 'value' },
        warning: 'Unexpected query parameters',
      });
    });

    it('should log warning for non-JSON accept header', () => {
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: { accept: 'text/html' },
        cookies: {},
        get: () => 'text/html',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Non-JSON accept header detected', {
        accept: 'text/html',
      });
    });

    it('should handle missing accept header', () => {
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {},
        cookies: {},
        get: () => undefined,
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Welcome to the Express Server Template API',
        timestamp: expect.any(String),
      });
    });

    it('should handle errors and pass them to next middleware', () => {
      const error = new Error('Test error');
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {},
        cookies: {},
        get: () => {
          throw error;
        },
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error in home controller', {
        error: error.message,
        stack: error.stack,
      });
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle requests with cookies', () => {
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {},
        cookies: { sessionId: '123', theme: 'dark' },
        get: () => 'application/json',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.debug).toHaveBeenCalledWith('Request headers', {
        headers: {},
        cookies: { sessionId: '123', theme: 'dark' },
      });
    });

    it('should handle requests with custom headers', () => {
      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {
          'x-custom-header': 'test',
          'user-agent': 'test-agent',
        },
        cookies: {},
        get: () => 'application/json',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.debug).toHaveBeenCalledWith('Request headers', {
        headers: {
          'x-custom-header': 'test',
          'user-agent': 'test-agent',
        },
        cookies: {},
      });
    });

    it('should handle requests with both query parameters and non-JSON accept header', () => {
      const req = {
        query: { page: '1', sort: 'desc' },
        path: '/',
        method: 'GET',
        headers: { accept: 'text/html' },
        cookies: {},
        get: () => 'text/html',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Query parameters detected', {
        params: { page: '1', sort: 'desc' },
        warning: 'Unexpected query parameters',
      });
      expect(logger.warn).toHaveBeenCalledWith('Non-JSON accept header detected', {
        accept: 'text/html',
      });
    });

    it('should log all request information for debugging', () => {
      const req = {
        query: { debug: 'true' },
        path: '/test',
        method: 'GET',
        headers: { 'x-test': 'value' },
        cookies: { session: 'abc' },
        get: () => 'application/json',
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.info).toHaveBeenCalledWith('Handling root request', {
        query: { debug: 'true' },
        path: '/test',
        method: 'GET',
      });
      expect(logger.debug).toHaveBeenCalledWith('Request headers', {
        headers: { 'x-test': 'value' },
        cookies: { session: 'abc' },
      });
      expect(logger.warn).toHaveBeenCalledWith('Query parameters detected', {
        params: { debug: 'true' },
        warning: 'Unexpected query parameters',
      });
    });

    it('should handle complex error scenarios', () => {
      const complexError = new Error('Complex error');
      complexError.code = 'COMPLEX_ERROR';
      complexError.details = { field: 'test' };

      const req = {
        query: {},
        path: '/',
        method: 'GET',
        headers: {},
        cookies: {},
        get: () => {
          throw complexError;
        },
      };
      const res = { json: vi.fn() };
      const next = vi.fn();

      homeController.getHome(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error in home controller', {
        error: complexError.message,
        stack: complexError.stack,
      });
      expect(next).toHaveBeenCalledWith(complexError);
    });
  });
});
