// frontend/src/services/contactService.js

import api from './api';

const contactService = {
  sendMessage: async (formData) => {
    // The api instance already includes the base URL
    return api.post('/contact/send', formData);
  }
};

export default contactService;