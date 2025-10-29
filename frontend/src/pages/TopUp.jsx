// src/pages/TopUp.jsx

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  // --- CHANGE DEFAULT STATE HERE ---
  const [quantity, setQuantity] = useState(1); // Default to 1 enhancement for $1
  // --- END CHANGE ---

  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setError("");
    try {
      // Backend expects quantity, amount is calculated there (quantity * 100)
      const res = await billingService.createTopUpPaymentIntent(quantity);
      if (res.data.clientSecret) {
        setClientSecret(res.data.clientSecret);
      } else {
        setError("Could not initialize payment.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start payment process.");
    } finally {
      setIsProcessing(false);
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
        <div className="workbench-panel">
          {!clientSecret ? (
            <>
              <h3>Top-Up Your Enhancements</h3>
              <p>Purchase more credits to continue optimizing your resume.</p>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group" style={{maxWidth: '300px', margin: '2rem auto'}}>
                <label htmlFor="quantity-select">Select Number of Enhancements</label>
                <select
                  id="quantity-select"
                  className="jd-textarea" // Re-using a style that works for select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  {/* --- MODIFY OPTIONS HERE --- */}
                  <option value={1}>1 Enhancement ($1.00)</option> {/* Added $1 option */}
                  <option value={5}>5 Enhancements ($5.00)</option>
                  <option value={10}>10 Enhancements ($10.00)</option>
                  {/* <option value={15}>15 Enhancements ($15.00)</option> */} {/* Optional: remove others */}
                  {/* --- END MODIFY OPTIONS --- */}
                </select>
              </div>
              <div className="panel-actions simplified">
                <button
                  className="submit-button"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Initializing..." : `Proceed to Pay $${price.toFixed(2)}`} {/* Use calculated price */}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Complete Your Payment</h3>
              <p>You are purchasing {quantity} enhancement credit(s) for ${price.toFixed(2)}.</p> {/* Use calculated price */}
              <Elements options={options} stripe={stripePromise}>
                <PaymentForm />
              </Elements>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;