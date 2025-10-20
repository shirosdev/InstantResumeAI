// src/pages/PaymentStatus.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
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

    // Store the initial credit count *before* payment confirmation
    const initialCreditsRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const hasStartedPollingRef = useRef(false); // Prevent multiple polling starts

    // --- REVISED LOGIC: Capture initial credits ONCE ---
    useEffect(() => {
        // Capture credits only if they haven't been captured yet
        if (userStatus && initialCreditsRef.current === null) {
            const remaining = userStatus.remaining_enhancements;
            initialCreditsRef.current = typeof remaining === 'number' ? remaining : 0;
            console.log(`[PaymentStatus] Initial credits captured: ${initialCreditsRef.current}`);
        }
    }, [userStatus]); // Depend only on userStatus

    // --- REVISED POLLING LOGIC ---
    const startPolling = useCallback(async () => {
        // Ensure polling starts only once and initial credits are known
        if (hasStartedPollingRef.current || initialCreditsRef.current === null) {
            console.log(`[PaymentStatus] Polling skipped (already started: ${hasStartedPollingRef.current}, initialCredits: ${initialCreditsRef.current})`);
            return;
        }
        hasStartedPollingRef.current = true;
        setMessage('Payment Succeeded! Updating your account...');
        console.log('[PaymentStatus] Starting status polling...');

        let pollCount = 0;
        const maxPolls = 30; // 60 seconds total (30 * 2s)
        const pollInterval = 2000; // 2 seconds

        const pollAction = async () => {
            pollCount++;
            console.log(`[PaymentStatus] Polling attempt ${pollCount}/${maxPolls}`);

            try {
                // IMPORTANT: Always fetch FRESH status inside the poll
                const newStatus = await fetchUserStatus(true); // Pass true to force fetch
                const initialCredits = initialCreditsRef.current;

                if (newStatus && initialCredits !== null) {
                    const currentCredits = typeof newStatus.remaining_enhancements === 'number'
                        ? newStatus.remaining_enhancements
                        : 0;

                    console.log(`[PaymentStatus] Credits check - Initial: ${initialCredits}, Current: ${currentCredits}`);

                    // Check if credits have actually increased
                    if (currentCredits > initialCredits) {
                        console.log('[PaymentStatus] Credits increased! Update confirmed.');
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                        }
                        setMessage('Account updated successfully! Redirecting...');
                        setTimeout(() => navigate('/dashboard'), 1500); // Shorter redirect
                        return; // Stop polling
                    }
                } else {
                     console.log('[PaymentStatus] Polling: Could not get new status or initial credits missing.');
                }

                if (pollCount >= maxPolls) {
                    console.log('[PaymentStatus] Max polling attempts reached.');
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                    }
                    // Even if polling times out, the payment succeeded.
                    setMessage('Payment successful! Redirecting shortly. Your credits should update soon.');
                    setShowManualRefresh(true);
                    // Redirect anyway after a small delay
                    setTimeout(() => navigate('/dashboard'), 3000);
                }
            } catch (error) {
                console.error('[PaymentStatus] Error during status poll:', error);
                // Optionally stop polling on error or continue
            }
        };

        // Clear any existing interval before starting a new one
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(pollAction, pollInterval);
        pollAction(); // Call immediately for faster feedback

    }, [fetchUserStatus, navigate]); // Add dependencies for useCallback

    // --- REVISED EFFECT for Stripe Payment Intent Check ---
    useEffect(() => {
        if (!stripe || initialCreditsRef.current === null) {
             // Wait for stripe and initial credits
            console.log(`[PaymentStatus] Waiting for Stripe (${!!stripe}) and initial credits (${initialCreditsRef.current})`);
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');

        if (!clientSecret) {
            console.error('[PaymentStatus] Error: PaymentIntent client secret not found in URL.');
            setMessage('Error: Payment information not found.');
            setShowManualRefresh(true);
            return;
        }

        console.log('[PaymentStatus] Retrieving PaymentIntent status...');
        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            if (!paymentIntent) {
                 console.error('[PaymentStatus] Error: Failed to retrieve PaymentIntent.');
                 setMessage('Error checking payment status.');
                 setShowManualRefresh(true);
                 return;
            }

            console.log('[PaymentStatus] PaymentIntent status:', paymentIntent.status);

            switch (paymentIntent.status) {
                case 'succeeded':
                    // Start polling ONLY if payment succeeded
                    startPolling();
                    break;
                case 'processing':
                    setMessage('Your payment is processing. We will update your account once confirmed.');
                    setShowManualRefresh(true); // Allow refresh later
                    // Optionally redirect after a longer delay or show instructions
                    break;
                case 'requires_payment_method':
                    setMessage('Payment failed. Please try a different payment method.');
                    setShowManualRefresh(false); // No point refreshing
                    // Redirect back to top-up or show error
                     setTimeout(() => navigate('/top-up'), 4000);
                    break;
                default:
                    setMessage('Something went wrong with your payment. Please contact support.');
                    setShowManualRefresh(true);
                    break;
            }
        }).catch(error => {
            console.error('[PaymentStatus] Error retrieving PaymentIntent:', error);
            setMessage('Error checking payment status.');
            setShowManualRefresh(true);
        });

        // Cleanup function for the interval
        return () => {
            if (pollIntervalRef.current) {
                console.log('[PaymentStatus] Clearing poll interval on component unmount.');
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [stripe, startPolling, navigate]); // Depend on stripe and startPolling callback

    // --- REVISED Manual Refresh Handler ---
    const handleManualRefresh = async () => {
        setMessage('Refreshing account status...');
        setShowManualRefresh(false); // Hide button while refreshing
        try {
            await fetchUserStatus(true); // Force refresh
            // Redirect immediately after manual refresh attempt
             setMessage('Status refreshed. Redirecting...');
             setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error) {
             console.error('[PaymentStatus] Manual refresh failed:', error);
             setMessage('Could not refresh status. Please try again or go to dashboard.');
             setShowManualRefresh(true); // Show button again on error
        }
    };

    return (
         <div className="page-container">
            <div className="container">
                <div className="workbench-panel results-panel" style={{ textAlign: 'center' }}> {/* Center align content */}
                     {/* Optional: Add a subtle loading indicator */}
                    {(message.includes('Processing') || message.includes('Updating')) && (
                        <div style={{ margin: '2rem 0' }}>
                            <div className="spinner large"></div>
                        </div>
                    )}
                    <h3>{message}</h3>
                    {/* Simplified messages */}
                     {message.includes('Succeeded') || message.includes('successful') ? (
                        <p>Your account update is in progress.</p>
                     ) : message.includes('failed') || message.includes('Error') ? (
                         <p>There was an issue processing your request.</p>
                     ): null}

                    <div className="panel-actions simplified" style={{ marginTop: '2rem', justifyContent: 'center' }}>
                         {/* Always show dashboard link */}
                        <Link to="/dashboard" className="submit-button secondary">
                            Go to Dashboard
                        </Link>
                        {/* Conditional Manual Refresh Button */}
                        {showManualRefresh && (
                            <button
                                onClick={handleManualRefresh}
                                className="submit-button"
                            >
                                Check Status Now
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