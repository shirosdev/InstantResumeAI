// frontend/src/pages/TopUp.jsx

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css'; // For button styles
import '../styles/Billing.css'; // RECTIFIED: Added for card styling

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  const [quantity, setQuantity] = useState(5); 
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCreatePaymentIntent = async () => {
    setIsInitializing(true);
    setError("");

    if (!agreedToTerms) {
      setError('You must agree to the non-refundable terms to proceed.');
      setIsInitializing(false);
      return;
    }

    try {
      const res = await billingService.createTopUpPaymentIntent(quantity, agreedToTerms);
      if (res.data.clientSecret) {
        setClientSecret(res.data.clientSecret);
      } else {
        setError("Could not initialize payment.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start payment process.");
    } finally {
      setIsInitializing(false);
    }
  };

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  const price = quantity; // $1 per credit

  return (
    <div className="page-container billing-page"> {/* Used billing-page class for background */}
      <div className="container">
        
        <header className="history-page-header">
          <h1>Top-Up Your Enhancements</h1>
          <p>Purchase more credits to continue optimizing your resume.</p>
        </header>

        {/* RECTIFIED: Wrapped content in a billing-card for better UI */}
        <div className="billing-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {!clientSecret ? (
            <>
              {error && <div className="error-message main-error">{error}</div>}
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="quantity-select"
                  style={{ display: 'block', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--text-primary)' }}
                >
                  Select Number of Credits
                </label>
                <select
                  id="quantity-select"
                  className="top-up-select" // New class for styling
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  <option value={5}>5 Credits ($5.00)</option>
                  <option value={10}>10 Credits ($10.00)</option>
                  <option value={20}>20 Credits ($20.00)</option>
                  <option value={50}>50 Credits ($50.00)</option>
                </select>
              </div>
              
              <div className="top-up-terms">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms-agree" style={{ cursor: 'pointer', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  I understand and agree that this purchase is <strong>non-refundable</strong>.
                </label>
              </div>

              <div className="billing-card-actions">
                <button
                  className="submit-button"
                  onClick={handleCreatePaymentIntent}
                  disabled={isInitializing || !agreedToTerms}
                  style={{ width: '100%' }}
                >
                  {isInitializing ? "Initializing..." : `Proceed to Pay $${price.toFixed(2)}`}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Complete Payment</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You are purchasing: <strong>{quantity} Credits for ${price.toFixed(2)}</strong>
              </p>
              <Elements options={options} stripe={stripePromise}>
                <PaymentForm agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms} />
              </Elements>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => { setClientSecret(''); setError(''); }} 
                  className="submit-button secondary"
                  style={{ width: '100%' }}
                >
                  Cancel / Change Amount
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default TopUpPage;