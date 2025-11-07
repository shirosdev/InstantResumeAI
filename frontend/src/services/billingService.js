// frontend/src/services/billingService.js
// --- COMPLETE RECTIFIED FILE ---

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

  downloadInvoice: async () => {
    try {
      const response = await api.get('/billing/download-invoice', {
        responseType: 'blob', // Expect a file response
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header
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
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
      
    } catch (error) {
      console.error('Invoice download error:', error);
      // Handle error if the response is JSON (e.g., "No transaction history found")
      if (error.response && error.response.data instanceof Blob) {
         try {
            // Try to read the blob error as text
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

  // --- NEW FUNCTION FOR DOWNLOADING RECEIPTS ---
  downloadReceipt: async () => {
    try {
      const response = await api.get('/billing/download-receipt', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'receipt.pdf'; // Default
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
      console.error('Receipt download error:', error);
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
};

export default billingService;