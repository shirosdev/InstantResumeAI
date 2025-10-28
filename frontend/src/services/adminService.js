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
  getSystemStats: () => {
    return api.get('/admin/system/stats');
  },
  getSupportTickets: () => {
    return api.get('/admin/support-tickets');
  },

  resolveSupportTicket: (ticketId) => {
    return api.put(`/admin/support-tickets/${ticketId}/resolve`);
  },
  getTicketDetails: (ticketId) => {
    return api.get(`/admin/support-tickets/${ticketId}`);
  },

  postTicketReply: (ticketId, replyMessage) => {
    return api.post(`/admin/support-tickets/${ticketId}/reply`, { reply_message: replyMessage });
  },

  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
};

export default adminService;