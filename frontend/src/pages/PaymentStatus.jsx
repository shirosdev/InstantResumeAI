// src/pages/PaymentStatus.jsx

import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/ResumeEnhancement.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StatusComponent = () => {
    const stripe = useStripe();
    const navigate = useNavigate();
    const { userStatus, fetchUserStatus } = useAuth();
    const [message, setMessage] = useState('Processing your payment...');
    const [showManualRefresh, setShowManualRefresh] = useState(false);

    const initialCreditsRef = useRef(null);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (userStatus && initialCreditsRef.current === null) {
            const remaining = userStatus.remaining_enhancements;
            initialCreditsRef.current = typeof remaining === 'number' ? remaining : 0;
            console.log(`Initial credits captured: ${initialCreditsRef.current}`);
        }
    }, [userStatus]);

    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');

        if (!clientSecret) {
            setMessage('Error: Payment information not found.');
            setShowManualRefresh(true);
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            console.log('PaymentIntent status:', paymentIntent.status);
            
            switch (paymentIntent.status) {
                case 'succeeded':
                    setMessage('Payment Succeeded! Updating your account...');
                    
                    let pollCount = 0;
                    const maxPolls = 30; // 60 seconds total (30 * 2s)
                    const pollInterval = 2000; // 2 seconds

                    const pollStatus = async () => {
                        pollCount++;
                        console.log(`Polling attempt ${pollCount}/${maxPolls}`);
                        
                        try {
                            const newStatus = await fetchUserStatus();
                            const initialCredits = initialCreditsRef.current;
                            
                            if (newStatus && initialCredits !== null) {
                                const currentCredits = typeof newStatus.remaining_enhancements === 'number' 
                                    ? newStatus.remaining_enhancements 
                                    : 0;
                                
                                console.log(`Credits check - Initial: ${initialCredits}, Current: ${currentCredits}`);
                                
                                if (currentCredits > initialCredits) {
                                    console.log('Credits increased! Update confirmed.');
                                    if (pollIntervalRef.current) {
                                        clearInterval(pollIntervalRef.current);
                                    }
                                    setMessage('Account updated successfully! Redirecting...');
                                    setTimeout(() => navigate('/dashboard'), 2000);
                                    return;
                                }
                            }
                            
                            if (pollCount >= maxPolls) {
                                console.log('Max polling attempts reached');
                                if (pollIntervalRef.current) {
                                    clearInterval(pollIntervalRef.current);
                                }
                                setMessage('Payment successful! Your credits may take a moment to update.');
                                setShowManualRefresh(true);
                            }
                        } catch (error) {
                            console.error('Error polling status:', error);
                        }
                    };

                    pollIntervalRef.current = setInterval(pollStatus, pollInterval);
                    pollStatus(); // Call immediately

                    return () => {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                        }
                    };
                
                case 'processing':
                    setMessage('Your payment is processing. Please wait...');
                    setShowManualRefresh(true);
                    break;
                
                case 'requires_payment_method':
                    setMessage('Payment failed. Please try again.');
                    setShowManualRefresh(true);
                    break;
                
                default:
                    setMessage('Something went wrong with your payment.');
                    setShowManualRefresh(true);
                    break;
            }
        }).catch(error => {
            console.error('Error retrieving payment intent:', error);
            setMessage('Error checking payment status.');
            setShowManualRefresh(true);
        });

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [stripe, navigate, fetchUserStatus]);

    const handleManualRefresh = async () => {
        setMessage('Refreshing your account status...');
        await fetchUserStatus();
        setTimeout(() => {
            navigate('/dashboard');
        }, 1000);
    };

    return (
        <div className="page-container">
            <div className="container">
                <div className="workbench-panel results-panel">
                    <h3>{message}</h3>
                    {message.includes('succeeded') || message.includes('Succeeded') ? (
                        <p>Your payment was successful!</p>
                    ) : null}
                    <div className="panel-actions simplified" style={{ marginTop: '2rem' }}>
                        <Link to="/dashboard" className="submit-button secondary">
                            Go to Dashboard
                        </Link>
                        {showManualRefresh && (
                            <button 
                                onClick={handleManualRefresh} 
                                className="submit-button"
                            >
                                Refresh Status Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaymentStatusPage = () => {
    return (
        <Elements stripe={stripePromise}>
            <StatusComponent />
        </Elements>
    );
};

export default PaymentStatusPage;