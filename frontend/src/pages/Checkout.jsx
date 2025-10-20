import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";
import billingService from '../services/billingService';
import '../styles/ResumeEnhancement.css';

// Load Stripe outside of the component render to avoid re-creating the object
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    billingService.createPaymentIntent()
      .then((res) => {
        if (res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
        } else {
          setError("Could not initialize payment. Please try again later.");
        }
      })
      .catch(err => {
        console.error("Error creating payment intent:", err);
        setError(err.response?.data?.error || "A server error occurred. Could not start payment process.");
      });
  }, []);

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="workbench-panel">
          <h3>Complete Your Payment</h3>
          
          {error && <div className="error-message">{error}</div>}

          {!error && clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <PaymentForm />
            </Elements>
          )}

          {!error && !clientSecret && <div className="loading">Initializing payment...</div>}
        </div>
      </div>
    </div>
  );
}