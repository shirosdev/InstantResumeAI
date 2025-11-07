// frontend/src/pages/Billing.jsx
// --- COMPLETE RECTIFIED FILE ---

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import billingService from '../services/billingService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import '../styles/Billing.css'; // New CSS file for styling

const Billing = () => {
  const { userStatus, loading: authLoading } = useAuth();
  
  // State for the INVOICE button
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  
  // NEW state for the RECEIPT button
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  
  const [error, setError] = useState('');

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    setError('');
    try {
      await billingService.downloadInvoice();
    } catch (err) {
      console.error(err);
      // Use the specific error message from the server
      setError(err.message || 'No subscription invoice found.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  // NEW handler for the receipt button
  const handleDownloadReceipt = async () => {
    setIsDownloadingReceipt(true);
    setError('');
    try {
      await billingService.downloadReceipt();
    } catch (err) {
      console.error(err);
      // Use the specific error message from the server
      setError(err.message || 'No credit receipt found.');
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
          <h1>Billing Information</h1>
          <p>Review your current plan and download your invoices.</p>
        </header>

        {error && <div className="error-message main-error">{error}</div>}

        <div className="billing-cards-container">
          {/* Card for Current Plan (Unchanged) */}
          <div className="billing-card">
            <h3>Current Subscription Plan</h3>
            <div className="plan-details-grid">
              <strong>Plan:</strong>
              <span>{userStatus.plan_name || 'N/A'}</span>
              
              <strong>Total Credits Used:</strong>
              <span>{userStatus.enhancement_count}</span>
              
              <strong>Purchased Credits:</strong>
              <span>{userStatus.purchased_credits}</span>
              
              <strong>Remaining Enhancements:</strong>
              <span className="plan-remaining">
                {userStatus.remaining_enhancements === 'unlimited' 
                  ? 'Unlimited' 
                  : userStatus.remaining_enhancements}
              </span>
            </div>
            <div className="billing-card-actions">
              <Link to="/top-up" className="submit-button secondary">
                Purchase More Credits
              </Link>
            </div>
          </div>

          {/* RECTIFIED Card for Invoice History */}
          <div className="billing-card">
            <h3>Invoice History</h3>
            <p className="invoice-description">
              Download your latest subscription or credit invoices.
            </p>
            <div className="invoice-history-list">
              
              {/* Button for Subscription Invoices */}
              <div className="invoice-item">
                <div className="invoice-details">
                  <strong>Latest Subscription Invoice</strong>
                  <span>(For monthly/annual plans)</span>
                </div>
                <button 
                  className="submit-button"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                >
                  {isDownloadingInvoice ? 'Generating...' : 'Download'}
                </button>
              </div>
              
              {/* NEW Button for Top-Up Receipts */}
              <div className="invoice-item">
                <div className="invoice-details">
                  <strong>Latest Credit Receipt</strong>
                  <span>(For top-up purchases)</span>
                </div>
                <button 
                  className="submit-button"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                >
                  {isDownloadingReceipt ? 'Generating...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;