import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TopUpPage = () => {
  const [quantity, setQuantity] = useState(5);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setError("");
    try {
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

  return (
    <div className="page-container">
      <div className="container">
        <div className="workbench-panel">
          {!clientSecret ? (
            <>
              <h3>Top-Up Your Enhancements</h3>
              <p>You've used all your free enhancements. Purchase more to continue optimizing your resume.</p>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group" style={{maxWidth: '300px', margin: '2rem auto'}}>
                <label htmlFor="quantity-select">Select Number of Enhancements</label>
                <select 
                  id="quantity-select" 
                  className="jd-textarea" // Re-using a style that works for select
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  <option value={5}>5 Enhancements ($5.00)</option>
                  <option value={10}>10 Enhancements ($10.00)</option>
                  <option value={15}>15 Enhancements ($15.00)</option>
                </select>
              </div>
              <div className="panel-actions simplified">
                <button 
                  className="submit-button" 
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Initializing..." : `Proceed to Pay $${(quantity).toFixed(2)}`}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Complete Your Payment</h3>
              <p>You are purchasing {quantity} enhancement credits for ${(quantity).toFixed(2)}.</p>
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