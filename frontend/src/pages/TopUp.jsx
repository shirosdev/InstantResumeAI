// frontend/src/pages/TopUp.jsx
// --- COMPLETE UPDATED FILE ---

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css'; // For button styles
import '../styles/Pricing.css'; // For layout and new top-up styles

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  const [quantity, setQuantity] = useState(5); // Default to 5 credits
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
    <div className="page-container billing-page">
      <div className="container">
        {/* Use the new modern card style */}
        <div className="billing-card-modern top-up-panel">
          
          {!clientSecret ? (
            /* --- STEP 1: Amount Selection --- */
            <>
              <h3>Top-Up Your Enhancements</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Purchase more credits to continue optimizing your resume.
              </p>
              
              {error && <div className="error-message main-error">{error}</div>}
              
              <div className="top-up-form-group">
                <label htmlFor="quantity-select">
                  Select Number of Credits
                </label>
                <select
                  id="quantity-select"
                  className="top-up-quantity-select" // Use new custom class
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  <option value={1}>1 Credit ($1.00)</option>
                  <option value={5}>5 Credits ($5.00)</option>
                  <option value={10}>10 Credits ($10.00)</option>
                </select>
              </div>
              
              <div className="payment-terms-agreement">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms-agree">
                  I understand and agree that this purchase is non-refundable.
                </label>
              </div>

              <div className="panel-actions simplified">
                <button
                  className="submit-button"
                  onClick={handleCreatePaymentIntent}
                  disabled={isInitializing || !agreedToTerms}
                >
                  {isInitializing ? "Initializing..." : `Proceed to Pay $${price.toFixed(2)}`}
                </button>
              </div>
            </>
          ) : (
            /* --- STEP 2: Payment Form --- */
            <>
              <h3>Complete Your Payment</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You are purchasing: <strong>{quantity} Credits (${price.toFixed(2)})</strong>
              </p>
              
              <Elements options={options} stripe={stripePromise}>
                <PaymentForm 
                  agreedToTerms={agreedToTerms} 
                  setAgreedToTerms={setAgreedToTerms} 
                />
              </Elements>
              
              <div className="panel-actions simplified" style={{marginTop: '2rem', borderTop: '1px solid var(--border-primary)', paddingTop: '2rem'}}>
                <button 
                  onClick={() => { setClientSecret(''); setError(''); }} 
                  className="submit-button secondary"
                >
                  Change Amount
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