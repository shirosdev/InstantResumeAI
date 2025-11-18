// frontend/src/pages/Checkout.jsx

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PaymentForm from "../components/PaymentForm";
import billingService from '../services/billingService';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/ResumeEnhancement.css';
import '../styles/Pricing.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const ErrorMessagePanel = ({ error, onGoBack }) => (
  <div className="workbench-panel">
    <h3>Something went wrong</h3>
    <div className="error-message main-error" style={{ textAlign: 'center' }}>
      {error || "An unknown error occurred."}
    </div>
    <div className="panel-actions simplified">
      <button onClick={onGoBack} className="submit-button secondary">
        Go Back
      </button>
    </div>
  </div>
);

const CheckoutPage = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const { purchaseType, item } = location.state || {};
  const [agreedToTerms, setAgreedToTerms] = useState(item?.agreedToTerms || false);

  useEffect(() => {
    // 1. Validate State immediately on mount
    if (!location.state || !item) {
        console.error("No state found in checkout. Redirecting.");
        navigate('/pricing', { replace: true });
        return;
    }

    const fetchClientSecret = async () => {
      try {
        let response;
        
        if (purchaseType === 'subscription' && item?.id) {
          // Ensure ID is a number (Safety check)
          const planId = Number(item.id);
          if(isNaN(planId)) throw new Error("Invalid Plan ID");

          response = await billingService.createSubscriptionPaymentIntent(planId, agreedToTerms);
        
        } else if (purchaseType === 'top-up' && item?.quantity) {
          response = await billingService.createTopUpPaymentIntent(item.quantity, agreedToTerms);
        
        } else {
          throw new Error("Invalid purchase details.");
        }

        if (response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error("Could not initialize payment.");
        }

      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError(err.response?.data?.message || err.response?.data?.error || err.message || "A server error occurred.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    fetchClientSecret();
  }, [purchaseType, item, agreedToTerms, navigate, location.state]);

  // Render Logic
  if (!location.state || !item) return null; // Prevents flash before redirect

  const getSummary = () => {
    if (purchaseType === 'subscription') {
      return {
        title: "Complete Your Subscription",
        description: `You are subscribing to the ${item.name} plan.`,
        details: `${item.name} (${item.features[0].value})`,
        price: item.price
      };
    }
    if (purchaseType === 'top-up') {
      const price = item.quantity * 1.00;
      return {
        title: "Complete Your Top-Up",
        description: "You are purchasing one-time enhancement credits.",
        details: `${item.quantity} x Enhancement Credits`,
        price: price
      };
    }
    return { title: "", description: "", details: "", price: 0 };
  };

  const summary = getSummary();
  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };
  
  if (isInitializing) {
    return (
      <div className="page-container">
        <div className="container">
           <div className="workbench-panel">
             <LoadingSpinner message="Initializing secure payment..." />
           </div>
        </div>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="page-container">
        <div className="container">
          <ErrorMessagePanel 
            error={error} 
            onGoBack={() => navigate(purchaseType === 'top-up' ? '/top-up' : '/pricing')} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container billing-page">
      <div className="container">
        <div className="billing-card-modern top-up-panel">
          <h3>{summary.title}</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {summary.description}
          </p>
          
          <div className="invoice-item" style={{ marginBottom: '2rem' }}>
            <div className="invoice-details">
              <strong>Item:</strong>
              <span>{summary.details}</span>
            </div>
            <strong>${Number(summary.price).toFixed(2)}</strong>
          </div>

          <Elements options={options} stripe={stripePromise}>
            <PaymentForm 
              agreedToTerms={agreedToTerms} 
              setAgreedToTerms={setAgreedToTerms} 
            />
          </Elements>
          
          <div className="panel-actions simplified" style={{marginTop: '2rem', borderTop: '1px solid var(--border-primary)', paddingTop: '2rem'}}>
            <Link 
              to={purchaseType === 'top-up' ? '/top-up' : '/pricing'} 
              className="submit-button secondary"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;