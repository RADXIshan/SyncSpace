import axios from 'axios';
import { requestDebouncer } from './requestDebouncer';

// Simple request interceptor to add Authorization header and rate limiting
axios.interceptors.request.use(
  (config) => {
    // Rate limiting for GET requests to prevent spam
    if (config.method === 'get') {
      const url = `${config.method}:${config.url}`;
      if (!requestDebouncer.shouldAllowRequest(url, 10)) {
        return Promise.reject(new Error('Rate limited: Too many requests'));
      }
    }

    // Only add token if it doesn't already exist in headers
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simple response interceptor for logging (no automatic retry to prevent loops)
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Just log 401 errors, don't automatically retry
    if (error.response?.status === 401) {
      console.warn('Authentication error detected. You may need to refresh your session.');
    }
    
    // Don't log rate limiting errors to console
    if (error.message?.includes('Rate limited')) {
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axios;