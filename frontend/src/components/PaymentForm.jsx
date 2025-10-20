import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);

    // Determine the return URL based on environment
    const returnUrl = window.location.origin + '/payment-status';
    console.log('Payment return URL:', returnUrl);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl, // This will work in both dev and production
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
      console.error('Payment error:', error);
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit" 
        className="auth-button" 
        style={{marginTop: '20px'}}
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
        </span>
      </button>
      {message && (
        <div id="payment-message" style={{marginTop: '20px', color: '#ff4d4d'}}>
          {message}
        </div>
      )}
    </form>
  );
}