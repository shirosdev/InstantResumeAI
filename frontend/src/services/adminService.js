// src/services/adminService.js

import api from './api';

const adminService = {
  // NEW FUNCTION to get all overview stats
  getDashboardStats: () => {
    return api.get('/admin/users/stats');
  },

  getUsers: (page = 1, perPage = 15, searchQuery = '') => {
    return api.get(`/admin/users?page=${page}&per_page=${perPage}&search_query=${searchQuery}`);
  },

  getChartData: () => {
    return api.get('/admin/users/chart-data');
  },

  getUsageTracking: () => {
    return api.get('/admin/usage-tracking');
  },

  getUser: (userId) => {
    return api.get(`/admin/users/${userId}`);
  },
  getUserEnhancementHistory: (userId) => {
    return api.get(`/admin/users/${userId}/enhancement-history`);
  },

  getUserSecurityActivity: (userId) => {
    return api.get(`/admin/users/${userId}/activity`);
  },

  updateUserStatus: (userId, isActive) => {
    return api.put(`/admin/users/${userId}/status`, { is_active: isActive });
  },

  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
};

export default adminService;