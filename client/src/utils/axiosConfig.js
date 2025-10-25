import axios from 'axios';

// Simple request interceptor to add Authorization header
axios.interceptors.request.use(
  (config) => {
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

// Minimal response interceptor - no automatic actions
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Silent handling - no logs or automatic actions
    return Promise.reject(error);
  }
);

export default axios;