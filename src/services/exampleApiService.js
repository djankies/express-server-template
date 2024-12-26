import { get, post, put, del } from '../utils/http.js';

class ExampleApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Example GET request
  async getUsers() {
    try {
      return await get(`${this.baseURL}/users`);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  // Example GET request with query parameters
  async searchUsers(query) {
    try {
      return await get(`${this.baseURL}/users/search`, {
        params: { q: query },
      });
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  // Example POST request
  async createUser(userData) {
    try {
      return await post(`${this.baseURL}/users`, userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  // Example PUT request
  async updateUser(userId, userData) {
    try {
      return await put(`${this.baseURL}/users/${userId}`, userData);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Example DELETE request
  async deleteUser(userId) {
    try {
      return await del(`${this.baseURL}/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Example request with custom headers
  async getUserProfile(userId, token) {
    try {
      return await get(`${this.baseURL}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }
}

export default ExampleApiService;
