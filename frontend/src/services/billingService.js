import api from './api';

const billingService = {
  createPaymentIntent: () => {
    return api.post('/billing/create-payment-intent', {});
  },
  createTopUpPaymentIntent: (quantity) => {
    return api.post('/billing/create-payment-intent', { quantity });
  },
};

export default billingService;