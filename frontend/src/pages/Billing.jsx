// frontend/src/pages/Billing.jsx
// --- UPDATED FILE ---

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import billingService from '../services/billingService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import '../styles/Billing.css';

const Billing = () => {
  const { userStatus, loading: authLoading } = useAuth();
  
  // Separate loading states for the two buttons
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [error, setError] = useState('');

  // Handler for Subscription Invoice
  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    setError('');
    try {
      await billingService.downloadInvoice();
    } catch (err) {
      console.error(err);
      // Check specifically for 404 to give a better message
      if (err.message && err.message.includes('404')) {
          setError('No invoice found. You have not made any subscription purchases yet.');
      } else {
          setError(err.message || 'Failed to download invoice.');
      }
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setIsDownloadingReceipt(true);
    setError('');
    try {
      await billingService.downloadReceipt();
    } catch (err) {
      console.error(err);
      // Check specifically for 404
      if (err.message && err.message.includes('404')) {
          setError('No receipt found. You have not purchased any top-up credits yet.');
      } else {
          setError(err.message || 'Failed to download receipt.');
      }
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  if (authLoading || !userStatus) {
    return <LoadingSpinner message="Loading billing details..." />;
  }

  return (
    <div className="page-container billing-page">
      <div className="container">
        <header className="history-page-header">
          <h1>Billing & Subscription</h1>
          <p>Manage your plan usage and billing history</p>
        </header>

        {error && <div className="error-message main-error">{error}</div>}

        <div className="billing-cards-container">
          
          {/* Card 1: Subscription & Usage */}
          <div className="billing-card">
            <h3>Current Plan Usage</h3>
            <div className="plan-details-grid">
              <strong>Current Plan</strong>
              <span>{userStatus.plan_name || 'N/A'}</span>
              
              <strong>Total Credits Used</strong>
              <span>{userStatus.enhancement_count}</span>
              
              <strong>Purchased Credits</strong>
              <span>{userStatus.purchased_credits}</span>
              
              <strong>Remaining Balance</strong>
              <span className="plan-remaining">
                {userStatus.remaining_enhancements === 'unlimited' 
                  ? 'Unlimited' 
                  : userStatus.remaining_enhancements}
              </span>
            </div>
            <div className="billing-card-actions">
              <Link to="/top-up" className="submit-button">
                Purchase More Credits
              </Link>
            </div>
          </div>

          {/* Card 2: Invoice & Receipt History */}
          <div className="billing-card">
            <h3>Document History</h3>
            <p className="invoice-description">
              Download the latest documents for your most recent transaction.
            </p>
            
            <div className="invoice-history-list">
              
              {/* Item 1: Invoice */}
              <div className="invoice-item">
                <div className="invoice-details">
                  <strong>Latest Invoice</strong>
                  <span>(Official Tax Invoice)</span>
                </div>
                <button 
                  className="submit-button"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                >
                  {isDownloadingInvoice ? 'Loading...' : 'Download Invoice'}
                </button>
              </div>

              {/* Item 2: Receipt */}
              <div className="invoice-item">
                <div className="invoice-details">
                  <strong>Latest Receipt</strong>
                  <span>(Payment Proof)</span>
                </div>
                <button 
                  className="submit-button secondary" /* Changed to secondary style for distinction */
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                >
                  {isDownloadingReceipt ? 'Loading...' : 'Download Receipt'}
                </button>
              </div>

            </div>
            <div style={{ marginTop: 'auto' }}></div> 
          </div>

        </div>
      </div>
    </div>
  );
};
export default Billing;