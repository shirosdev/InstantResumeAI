import React, { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ResumeEnhancement.css';

const PaymentStatusContent = () => {
  const stripe = useStripe();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    if (!stripe) {
      return; // Stripe.js has not yet loaded.
    }

    // Retrieve the PaymentIntent client secret from the URL query string
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      setMessage('Error: Payment information not found.');
      return;
    }

    // Retrieve the PaymentIntent
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('✅ Payment Succeeded!');
          setTimeout(() => navigate('/dashboard'), 3000); // Redirect after success
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('❌ Payment failed. Please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe, navigate]);

  return (
    <div className="page-container">
      <div className="container">
        <div className="workbench-panel results-panel">
          <h3>{message}</h3>
          {message.includes('Succeeded') && <p>You will be redirected to your dashboard shortly.</p>}
          <div className="panel-actions simplified" style={{ marginTop: '2rem' }}>
            <Link to="/dashboard" className="submit-button secondary">Go to Dashboard Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusContent;