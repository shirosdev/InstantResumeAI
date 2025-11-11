// frontend/src/pages/TopUp.jsx
// --- REFACTORED to navigate to the unified /checkout page ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../styles/ResumeEnhancement.css'; // For button styles
import '../styles/Pricing.css'; // For layout and new top-up styles

// Stripe imports are no longer needed here
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import PaymentForm from '../components/PaymentForm';
// import billingService from '../services/billingService';

// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  const [quantity, setQuantity] = useState(5); // Default to 5 credits
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); // Initialize navigate

  const handleProceedToCheckout = () => {
    setError("");

    if (!agreedToTerms) {
      setError('You must agree to the non-refundable terms to proceed.');
      return;
    }

    const price = quantity; // $1 per credit

    // Navigate to the central checkout page with top-up details
    navigate('/checkout', {
      state: {
        purchaseType: 'top-up',
        item: {
          quantity: quantity,
          price: price,
          // We pass agreement, so checkout can use it
          agreedToTerms: agreedToTerms 
        }
      }
    });
  };

  const price = quantity; // $1 per credit

  return (
    <div className="page-container billing-page">
      <div className="container">
        {/* Use the new modern card style */}
        <div className="billing-card-modern top-up-panel">
          
          {/* This is now the only view for this page */}
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
                className="top-up-quantity-select"
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
                onClick={handleProceedToCheckout}
                disabled={!agreedToTerms}
              >
                {`Proceed to Pay $${price.toFixed(2)}`}
              </button>
            </div>
          </>
          
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;