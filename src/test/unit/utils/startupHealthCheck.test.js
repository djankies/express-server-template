import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { waitForHealthy } from '../../../utils/startupHealthCheck.js';

vi.mock('http');

describe('startupHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    console.info = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('waitForHealthy', () => {
    it('should resolve when service is healthy', async () => {
      const mockResponse = {
        on: vi.fn(),
        statusCode: 200,
      };

      const mockRequest = {
        on: vi.fn(),
        end: vi.fn(),
      };

      // Mock response data events
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('{"status":"ok"}');
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      // Mock http.get
      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await waitForHealthy('Test Service');

      expect(result).toBe(true);
      expect(console.info).toHaveBeenCalledWith(
        '\x1b[34mℹ Waiting for Test Service to become healthy...\x1b[0m',
      );
      expect(console.info).toHaveBeenCalledWith('\x1b[32m✓ Service is healthy and ready\x1b[0m');
    });

    it('should retry on non-200 status code', async () => {
      const mockResponse = {
        on: vi.fn(),
        statusCode: 503,
      };

      const mockRequest = {
        on: vi.fn(),
        end: vi.fn(),
      };

      // Mock response data events
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('{"status":"degraded"}');
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      // Mock http.get
      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const waitPromise = waitForHealthy();

      // Fast-forward all timers 30 times (default retries)
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(1000);
        await vi.runAllTimersAsync();
      }

      const result = await waitPromise;
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '\x1b[31m✗ Health check failed:\x1b[0m',
        'Health check timeout',
      );
    });

    it('should retry on request error', async () => {
      const mockRequest = {
        on: vi.fn(),
        end: vi.fn(),
      };

      // Mock request error event
      mockRequest.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Connection refused'));
        }
        return mockRequest;
      });

      // Mock http.get
      http.get.mockReturnValue(mockRequest);

      const waitPromise = waitForHealthy();

      // Fast-forward all timers 30 times (default retries)
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(1000);
        await vi.runAllTimersAsync();
      }

      const result = await waitPromise;
      expect(result).toBe(false);
    });

    it('should retry on JSON parse error', async () => {
      const mockResponse = {
        on: vi.fn(),
        statusCode: 200,
      };

      const mockRequest = {
        on: vi.fn(),
        end: vi.fn(),
      };

      // Mock response data events with invalid JSON
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('invalid json');
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      // Mock http.get
      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const waitPromise = waitForHealthy();

      // Fast-forward all timers 30 times (default retries)
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(1000);
        await vi.runAllTimersAsync();
      }

      const result = await waitPromise;
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '\x1b[31m✗ Health check failed:\x1b[0m',
        'Health check timeout',
      );
    });

    it('should use custom retries and interval', async () => {
      const mockResponse = {
        on: vi.fn(),
        statusCode: 503,
      };

      const mockRequest = {
        on: vi.fn(),
        end: vi.fn(),
      };

      // Mock response data events
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('{"status":"degraded"}');
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      // Mock http.get
      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const customRetries = 5;
      const customInterval = 500;
      const waitPromise = waitForHealthy('Test Service', customRetries, customInterval);

      // Fast-forward all timers customRetries times
      for (let i = 0; i < customRetries; i++) {
        vi.advanceTimersByTime(customInterval);
        await vi.runAllTimersAsync();
      }

      const result = await waitPromise;
      expect(result).toBe(false);
    });
  });
});
