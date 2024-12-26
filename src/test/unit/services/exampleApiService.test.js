import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExampleApiService from '../../../services/exampleApiService.js';
import * as http from '../../../utils/http.js';

// Mock the http utility functions
vi.mock('../../../utils/http.js', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('ExampleApiService', () => {
  const baseURL = 'https://api.example.com';
  let service;

  beforeEach(() => {
    service = new ExampleApiService(baseURL);
    vi.clearAllMocks();

    // Reset all mocks to their default behavior
    http.get.mockReset();
    http.post.mockReset();
    http.put.mockReset();
    http.del.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should initialize with the provided base URL', () => {
      expect(service.baseURL).toBe(baseURL);
    });

    it('should handle base URL without trailing slash', () => {
      const serviceWithSlash = new ExampleApiService('https://api.example.com/');
      expect(serviceWithSlash.baseURL).toBe('https://api.example.com/');
    });
  });

  describe('getUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [{ id: 1, name: 'John' }];
      http.get.mockResolvedValueOnce(mockUsers);

      const result = await service.getUsers();

      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(`${baseURL}/users`);
      expect(result).toEqual(mockUsers);
    });

    it('should handle errors when fetching users', async () => {
      const error = new Error('Network error');
      http.get.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.getUsers();
      }).rejects.toThrow('Network error');

      expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response when fetching users', async () => {
      http.get.mockResolvedValueOnce([]);
      const result = await service.getUsers();
      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    it('should search users with query parameters', async () => {
      const mockUsers = [{ id: 1, name: 'John' }];
      const searchQuery = 'john';
      http.get.mockResolvedValueOnce(mockUsers);

      const result = await service.searchUsers(searchQuery);

      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(`${baseURL}/users/search`, {
        params: { q: searchQuery },
      });
      expect(result).toEqual(mockUsers);
    });

    it('should handle empty search query', async () => {
      const mockUsers = [];
      http.get.mockResolvedValueOnce(mockUsers);

      const result = await service.searchUsers('');

      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(`${baseURL}/users/search`, {
        params: { q: '' },
      });
      expect(result).toEqual([]);
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      http.get.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.searchUsers('test');
      }).rejects.toThrow('Search failed');
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      const mockResponse = { id: 1, ...userData };
      http.post.mockResolvedValueOnce(mockResponse);

      const result = await service.createUser(userData);

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(`${baseURL}/users`, userData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors during user creation', async () => {
      const userData = { name: '' };
      const error = new Error('Validation failed');
      http.post.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.createUser(userData);
      }).rejects.toThrow('Validation failed');
    });

    it('should handle empty user data', async () => {
      const error = new Error('User data is required');
      http.post.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.createUser({});
      }).rejects.toThrow('User data is required');
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const userId = 1;
      const userData = { name: 'John Updated' };
      const mockResponse = { id: userId, ...userData };
      http.put.mockResolvedValueOnce(mockResponse);

      const result = await service.updateUser(userId, userData);

      expect(http.put).toHaveBeenCalledTimes(1);
      expect(http.put).toHaveBeenCalledWith(`${baseURL}/users/${userId}`, userData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle non-existent user update', async () => {
      const userId = 999;
      const userData = { name: 'John' };
      const error = new Error('User not found');
      http.put.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.updateUser(userId, userData);
      }).rejects.toThrow('User not found');
    });

    it('should handle invalid user ID', async () => {
      const userData = { name: 'John' };
      const error = new Error('Invalid user ID');
      http.put.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.updateUser('invalid', userData);
      }).rejects.toThrow('Invalid user ID');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = 1;
      const mockResponse = { success: true };
      http.del.mockResolvedValueOnce(mockResponse);

      const result = await service.deleteUser(userId);

      expect(http.del).toHaveBeenCalledTimes(1);
      expect(http.del).toHaveBeenCalledWith(`${baseURL}/users/${userId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle non-existent user deletion', async () => {
      const userId = 999;
      const error = new Error('User not found');
      http.del.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.deleteUser(userId);
      }).rejects.toThrow('User not found');
    });

    it('should handle invalid user ID during deletion', async () => {
      const error = new Error('Invalid user ID');
      http.del.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.deleteUser('invalid');
      }).rejects.toThrow('Invalid user ID');
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile with authorization header', async () => {
      const userId = 1;
      const token = 'test-token';
      const mockProfile = { id: userId, name: 'John', email: 'john@example.com' };
      http.get.mockResolvedValueOnce(mockProfile);

      const result = await service.getUserProfile(userId, token);

      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(`${baseURL}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(result).toEqual(mockProfile);
    });

    it('should handle unauthorized access', async () => {
      const userId = 1;
      const error = new Error('Unauthorized');
      http.get.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.getUserProfile(userId, 'invalid-token');
      }).rejects.toThrow('Unauthorized');
    });

    it('should handle missing token', async () => {
      const userId = 1;
      const error = new Error('Token is required');
      http.get.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.getUserProfile(userId, '');
      }).rejects.toThrow('Token is required');
    });

    it('should handle non-existent user profile', async () => {
      const userId = 999;
      const token = 'test-token';
      const error = new Error('Profile not found');
      http.get.mockRejectedValueOnce(error);

      await expect(async () => {
        await service.getUserProfile(userId, token);
      }).rejects.toThrow('Profile not found');
    });
  });
});
