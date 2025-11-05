// frontend/src/services/billingService.js

import api from './api';

const billingService = {
  createPaymentIntent: () => {
    return api.post('/billing/create-payment-intent', {});
  },

  // --- RECTIFIED FUNCTION ---
  createTopUpPaymentIntent: (quantity, agreedToTerms) => {
    // Pass both quantity and agreedToTerms in the request body
    return api.post('/billing/create-payment-intent', { 
      quantity: quantity,
      agreedToTerms: agreedToTerms 
    });
  },
  // --- END RECTIFICATION ---
};

export default billingService;