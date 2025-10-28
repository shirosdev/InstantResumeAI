// frontend/src/pages/PaymentStatus.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/ResumeEnhancement.css'; // Reusing styles

// Load Stripe outside of component render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StatusComponent = () => {
    const stripe = useStripe();
    const navigate = useNavigate();
    const { userStatus, fetchUserStatus } = useAuth();
    const [message, setMessage] = useState('Processing your payment...');
    const [showManualRefresh, setShowManualRefresh] = useState(false);
    const initialCreditsRef = useRef(null);

    // Store the initial credit count before verification starts
    useEffect(() => {
        if (userStatus && initialCreditsRef.current === null) {
            const remaining = userStatus.remaining_enhancements;
            initialCreditsRef.current = typeof remaining === 'number' ? remaining : 0;
        }
    }, [userStatus]);

    useEffect(() => {
        if (!stripe) {
            return; // Stripe.js has not yet loaded.
        }

        const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
        if (!clientSecret) {
            setMessage('Error: Payment information not found.');
            setShowManualRefresh(true);
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
            switch (paymentIntent.status) {
                case 'succeeded':
                    setMessage('Payment Succeeded! Verifying your account update...');
                    
                    try {
                        const response = await api.get(
                            `/billing/verify-payment/${paymentIntent.id}`, 
                            { params: { initial_credits: initialCreditsRef.current } }
                        );

                        if (response.data.success) {
                            setMessage('Account updated successfully! Redirecting to your dashboard...');
                            await fetchUserStatus(); // Perform a final refresh
                            setTimeout(() => navigate('/dashboard'), 2500);
                        } else {
                            setMessage('Payment successful, but the credit update is taking longer than expected. Please check your dashboard shortly.');
                            setShowManualRefresh(true);
                        }
                    } catch (error) {
                        console.error('Error verifying payment:', error);
                        setMessage('Payment was successful, but we couldn\'t automatically confirm the credit update. Please check your dashboard.');
                        setShowManualRefresh(true);
                    }
                    break;
                
                case 'processing':
                    setMessage('Your payment is processing. We will update your account once it completes.');
                    break;
                
                case 'requires_payment_method':
                    setMessage('Payment failed. Please try again from the checkout page.');
                    setShowManualRefresh(true);
                    break;
                
                default:
                    setMessage('Something went wrong with your payment. Please contact support if this issue persists.');
                    setShowManualRefresh(true);
                    break;
            }
        });
    }, [stripe, navigate, fetchUserStatus]);

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="workbench-panel results-panel">
          <h3>{message}</h3>
          {!showManualRefresh ? (
            <div style={{ margin: '2rem 0' }}>
              <LoadingSpinner message="Verifying..." />
            </div>
          ) : null}
          {showManualRefresh && (
            <div className="panel-actions simplified" style={{ marginTop: '2rem' }}>
                <button onClick={handleGoToDashboard} className="submit-button secondary">
                    Go to Dashboard
                </button>
            </div>
          )}
        </div>
    );
};

// This is the main component that wraps everything in the Elements provider
const PaymentStatusPage = () => {
  const options = {
    // This is a placeholder; the client secret is retrieved from the URL in the child component
    clientSecret: 'pi_xxxxxxxx_secret_xxxxxxxx', 
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="page-container">
        <div className="container">
            <Elements stripe={stripePromise} options={options}>
                <StatusComponent />
            </Elements>
        </div>
    </div>
  );
};

export default PaymentStatusPage;