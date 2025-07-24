import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor - just add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simplified response interceptor - NO automatic refresh
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, just reject it - let the calling code handle it
    return Promise.reject(error);
  }
);

export default api; 