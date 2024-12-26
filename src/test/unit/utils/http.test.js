import { beforeEach, describe, expect, it, vi } from 'vitest';
import http, { del, get, patch, post, put } from '../../../utils/http.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('HTTP Utility', () => {
  const mockUrl = 'https://api.example.com/test';
  const mockData = { key: 'value' };
  const mockConfig = { headers: { 'X-Test': 'test' } };
  const mockResponse = { data: 'response' };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    http.get.mockResolvedValue(mockResponse);
    http.post.mockResolvedValue(mockResponse);
    http.put.mockResolvedValue(mockResponse);
    http.patch.mockResolvedValue(mockResponse);
    http.delete.mockResolvedValue(mockResponse);
  });

  describe('GET requests', () => {
    it('should make a GET request with correct parameters', async () => {
      await get(mockUrl, mockConfig);
      expect(http.get).toHaveBeenCalledWith(mockUrl, mockConfig);
    });

    it('should make a GET request without config', async () => {
      await get(mockUrl);
      expect(http.get).toHaveBeenCalledWith(mockUrl, {});
    });
  });

  describe('POST requests', () => {
    it('should make a POST request with correct parameters', async () => {
      await post(mockUrl, mockData, mockConfig);
      expect(http.post).toHaveBeenCalledWith(mockUrl, mockData, mockConfig);
    });

    it('should make a POST request without optional parameters', async () => {
      await post(mockUrl);
      expect(http.post).toHaveBeenCalledWith(mockUrl, {}, {});
    });
  });

  describe('PUT requests', () => {
    it('should make a PUT request with correct parameters', async () => {
      await put(mockUrl, mockData, mockConfig);
      expect(http.put).toHaveBeenCalledWith(mockUrl, mockData, mockConfig);
    });

    it('should make a PUT request without optional parameters', async () => {
      await put(mockUrl);
      expect(http.put).toHaveBeenCalledWith(mockUrl, {}, {});
    });
  });

  describe('PATCH requests', () => {
    it('should make a PATCH request with correct parameters', async () => {
      await patch(mockUrl, mockData, mockConfig);
      expect(http.patch).toHaveBeenCalledWith(mockUrl, mockData, mockConfig);
    });

    it('should make a PATCH request without optional parameters', async () => {
      await patch(mockUrl);
      expect(http.patch).toHaveBeenCalledWith(mockUrl, {}, {});
    });
  });

  describe('DELETE requests', () => {
    it('should make a DELETE request with correct parameters', async () => {
      await del(mockUrl, mockConfig);
      expect(http.delete).toHaveBeenCalledWith(mockUrl, mockConfig);
    });

    it('should make a DELETE request without config', async () => {
      await del(mockUrl);
      expect(http.delete).toHaveBeenCalledWith(mockUrl, {});
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      http.get.mockRejectedValue(networkError);

      await expect(get(mockUrl)).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
          config: { method: 'get', url: mockUrl },
        },
      };
      http.get.mockRejectedValue(apiError);

      await expect(get(mockUrl)).rejects.toEqual(apiError);
    });
  });
});
