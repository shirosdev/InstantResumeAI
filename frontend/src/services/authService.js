// frontend/src/services/authService.js

import api from './api';

const authService = {
  // Register a new user
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  // Login user
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Logout user
  logout: async () => {
    return api.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return api.put('/auth/profile', profileData);
  },
  

  getUserStatus: async () => {
    return api.get('/auth/status');
  },

  // Refresh access token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return api.post('/auth/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    return api.post('/auth/reset-password', { token, password: newPassword });
  },

  // Verify email
  verifyEmail: async (token) => {
    return api.post('/auth/verify-email', { token });
  }
};

export default authService;