// frontend/src/pages/Checkout.jsx
// --- COMPLETE RECTIFIED FILE ---

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PaymentForm from "../components/PaymentForm";
import billingService from '../services/billingService';
import LoadingSpinner from '../components/LoadingSpinner'; // Import loading spinner
import '../styles/ResumeEnhancement.css'; // For button styles
import '../styles/Pricing.css'; // For layout and new top-up styles

// Load Stripe outside of the component render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// A simple error panel
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

  // Get purchase details from location state
  // --- FIX: Destructure 'item' and rename it to 'plan' or 'topUpDetails'
  const { purchaseType, item } = location.state || {};
  const [agreedToTerms, setAgreedToTerms] = useState(item?.agreedToTerms || false);

  useEffect(() => {
    const fetchClientSecret = async () => {
      // Don't fetch if details are missing
      if (!purchaseType || !item) {
          setError("Invalid purchase details. Please start the process again.");
          setIsInitializing(false);
          return;
      }
      
      try {
        let response;
        
        if (purchaseType === 'subscription' && item?.id) {
          if (item.price <= 0) {
            throw new Error("This plan cannot be purchased this way. Please go back.");
          }
          // --- FIX: Pass plan_id and agreement status ---
          response = await billingService.createSubscriptionPaymentIntent(item.id, agreedToTerms);
        
        } else if (purchaseType === 'top-up' && item?.quantity) {
          // --- FIX: Pass quantity and agreement status ---
          response = await billingService.createTopUpPaymentIntent(item.quantity, agreedToTerms);
        
        } else {
          throw new Error("Invalid purchase details. Please start the process again.");
        }

        if (response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error("Could not initialize payment.");
        }

      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError(err.response?.data?.message || err.message || "A server error occurred.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    // Only run if we have the required details
    if (purchaseType && item) {
        fetchClientSecret();
    } else {
        setError("Invalid purchase details. Please start the process again.");
        setIsInitializing(false);
    }
  }, [purchaseType, item, agreedToTerms, location.state]); // Add agreedToTerms dependency

  const getSummary = () => {
    if (!item) return null;

    if (purchaseType === 'subscription') {
      return {
        title: "Complete Your Subscription",
        description: `You are subscribing to the ${item.name} plan.`,
        details: `${item.name} (${item.features[0].value})`,
        price: item.price
      };
    }
    if (purchaseType === 'top-up') {
      const price = item.quantity * 1.00; // $1 per credit
      return {
        title: "Complete Your Top-Up",
        description: "You are purchasing one-time enhancement credits.",
        details: `${item.quantity} x Enhancement Credits`,
        price: price
      };
    }
    return null; // Invalid state
  };

  const summary = getSummary();

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };
  
  // This is the main render logic
  const renderContent = () => {
    // State 1: Still fetching clientSecret from backend
    if (isInitializing) {
      return (
        <div className="workbench-panel">
          <LoadingSpinner message="Initializing payment..." />
        </div>
      );
    }

    // State 2: Fetching failed OR no valid clientSecret
    if (error || !clientSecret) {
      return (
        <ErrorMessagePanel 
          error={error || "Could not initialize payment session."} 
          onGoBack={() => navigate(purchaseType === 'top-up' ? '/top-up' : '/pricing')} 
        />
      );
    }
    
    // State 3: Success! We have a clientSecret, show the Stripe form
    return (
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
            // Send the setAgreedToTerms function to the PaymentForm
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
    );
  };

  return (
    <div className="page-container billing-page">
      <div className="container">
        {renderContent()}
      </div>
    </div>
  );
};

export default CheckoutPage;