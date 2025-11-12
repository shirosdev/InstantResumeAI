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
  getUnresolvedTicketCount: () => {
    return api.get('/admin/support-tickets/unresolved-count');
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

  manualAddCredits: (userId, credits, reason) => {
    return api.post('/billing/manual-add-credits', {
      user_id: parseInt(userId, 10),
      credits: parseInt(credits, 10),
      reason: reason
    });
  },

  cleanupExpiredTokens: () => {
    
    return api.post('/auth/cleanup-expired-tokens');
  },
  checkWebhook: () => {
    // This endpoint exists in your app/routes/billing.py
    return api.get('/billing/webhook-test');
  },
  sendBroadcastEmail: (subject, message) => {
    return api.post('/admin/broadcast-email', { subject, message });
  },
  getVisitorAnalytics: () => {
    return api.get('/admin/analytics/visitors');
  },
  resolveSupportTicket: (ticketId) => {
    return api.put(`/admin/support-tickets/${ticketId}/resolve`);
  },

};

export default adminService;