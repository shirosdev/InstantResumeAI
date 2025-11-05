// frontend/src/pages/TopUp.jsx
// RECTIFIED: Merged dropdown from previous code with checkbox from updated code.

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css'; // For button styles
import '../styles/Pricing.css'; // For layout

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  // State from your previous code
  const [quantity, setQuantity] = useState(5); // Default to 5 credits
  
  // State from the updated code
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false); // Renamed for clarity
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // This function is now updated to send 'agreedToTerms'
  const handleCreatePaymentIntent = async () => {
    setIsInitializing(true);
    setError("");

    // Check for agreement first
    if (!agreedToTerms) {
      setError('You must agree to the non-refundable terms to proceed.');
      setIsInitializing(false);
      return;
    }

    try {
      // Use the corrected service call that sends both quantity and agreement
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

  // Calculate price based on quantity ($1 per enhancement assumed)
  const price = quantity; // Simple calculation assuming $1 each

  return (
    <div className="page-container">
      <div className="container">
        {/* Using workbench-panel for the card style */}
        <div className="workbench-panel" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          {!clientSecret ? (
            <>
              <h3>Top-Up Your Enhancements</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Purchase more credits to continue optimizing your resume.
              </p>
              {error && <div className="error-message main-error">{error}</div>}
              
              {/* This is the dropdown UI from your previous code */}
              <div className="form-group" style={{maxWidth: '300px', margin: '2rem auto'}}>
                <label 
                  htmlFor="quantity-select"
                  style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1rem' }}
                >
                  Select Number of Credits
                </label>
                <select
                  id="quantity-select"
                  className="jd-textarea" // Re-using a style that works for select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  style={{ fontSize: '1.1rem', textAlign: 'center', padding: '0.8rem' }}
                >
                  <option value={1}>1 Credits ($1.00)</option>
                  <option value={5}>5 Credits ($5.00)</option>
                  <option value={10}>10 Credits ($10.00)</option>
                </select>
              </div>
              
              {/* This is the checkbox from the updated code */}
              <div className="payment-terms-agreement" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                margin: '2rem 0 1.5rem 0', 
                color: 'var(--text-primary)' 
              }}>
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--text-accent)' }}
                />
                <label htmlFor="terms-agree" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
                  I understand and agree that this purchase is non-refundable.
                </label>
              </div>

              {/* This button checks for agreement */}
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
            // This is the payment form section
            <>
              <h3>Complete Your Payment</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You are purchasing: <strong>{quantity} Credits (${price.toFixed(2)})</strong>
              </p>
              <Elements options={options} stripe={stripePromise}>
                {/* Pass the agreement props to PaymentForm */}
                <PaymentForm agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms} />
              </Elements>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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