// frontend/src/services/api.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- MODIFIED RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Check for 401 Unauthorized
    if (response && response.status === 401) {
      
      // Prevent redirect loop if the failed request was already to login/register
      if (originalRequest.url.endsWith('/auth/login') || originalRequest.url.endsWith('/auth/register')) {
        return Promise.reject(error);
      }

      // Set the expiration message for the login page to pick up
      sessionStorage.setItem('session_expired_message', 'Your session has expired. Please log in again.');

      // Clear all session data
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('lastEnhancementResult'); // Also clear app-specific data
      sessionStorage.removeItem('disclaimerAgreed'); // Clear app-specific data

      // Force redirect to login page. Check to avoid redundant navigation.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // For all other errors, just reject them
    return Promise.reject(error);
  }
);
// --- END OF MODIFICATION ---

export default api;