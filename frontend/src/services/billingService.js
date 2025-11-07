// frontend/src/services/billingService.js

import api from './api';

const billingService = {
  createPaymentIntent: () => {
    return api.post('/billing/create-payment-intent', {});
  },

  createTopUpPaymentIntent: (quantity, agreedToTerms) => {
    return api.post('/billing/create-payment-intent', { 
      quantity: quantity,
      agreedToTerms: agreedToTerms 
    });
  },

  downloadInvoice: async () => { // This is the only download function we need
    try {
      const response = await api.get('/billing/download-invoice', {
        responseType: 'blob', // Expect a file response
      });

      // ... (all the existing blob handling logic remains the same) ...
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'invoice.pdf'; // Default
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
      
    } catch (error) {
      console.error('Invoice download error:', error);
      if (error.response && error.response.data instanceof Blob) {
         try {
            const errText = await error.response.data.text();
            const errJson = JSON.parse(errText);
            throw new Error(errJson.message || 'Server error');
         } catch(e) {
            throw new Error('An unknown download error occurred.');
         }
      }
      throw error;
    }
  },

  // --- The downloadReceipt function has been removed ---
};

export default billingService;