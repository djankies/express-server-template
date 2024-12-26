import axios from 'axios';
import axiosRetry from 'axios-retry';

// Create axios instance with default config
const http = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
http.interceptors.request.use(
  config => {
    // You can add auth headers or other modifications here
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Add response interceptor
http.interceptors.response.use(
  response => {
    // You can transform response data here
    return response.data;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data, config: requestConfig } = error.response;
      console.error(
        `API Error: ${status} - ${requestConfig.method.toUpperCase()} ${requestConfig.url}`,
        data,
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  },
);

// Configure retry behavior
axiosRetry(http, {
  retries: 3, // number of retries
  retryDelay: axiosRetry.exponentialDelay, // exponential back-off
  retryCondition: error => {
    // Retry on network errors or 5xx errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    );
  },
});

// Utility functions for common HTTP methods
export const get = async (url, config = {}) => {
  return http.get(url, config);
};

export const post = async (url, data = {}, config = {}) => {
  return http.post(url, data, config);
};

export const put = async (url, data = {}, config = {}) => {
  return http.put(url, data, config);
};

export const patch = async (url, data = {}, config = {}) => {
  return http.patch(url, data, config);
};

export const del = async (url, config = {}) => {
  return http.delete(url, config);
};

export const validateRequest = (req, res, next) => {
  // Add any request validation logic here
  next();
};

// Export the axios instance for advanced usage
export default http;
