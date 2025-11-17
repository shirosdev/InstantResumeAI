// frontend/src/pages/Billing.jsx
// --- COMPLETE UPDATED FILE ---

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import billingService from '../services/billingService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import '../styles/Billing.css'; // Make sure this CSS is imported

const Billing = () => {
  const { userStatus, loading: authLoading } = useAuth();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    setError('');
    try {
      await billingService.downloadInvoice();
    } catch (err) {
      console.error(err);
      setError(err.message || 'No invoice or receipt found.');
    } finally {
      setIsDownloading(false);
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
          
          {/* Card for Current Plan - UPDATED CLASS */}
          <div className="billing-card-modern"> 
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

          {/* Card for Invoice History - UPDATED CLASS */}
          <div className="billing-card-modern">
            <h3>Invoice History</h3>
            <p className="invoice-description">
              Download your latest invoice for any subscription or credit purchase.
            </p>
            <div className="invoice-history-list">
              
              {!userStatus.has_invoice_history ? (
                // Show this message if no transactions exist
                <div className="invoice-item">
                  <p className="invoice-description" style={{textAlign: 'center', width: '100%', marginBottom: 0}}>
                    You have no invoices yet. Your transactions will appear here after a purchase.
                  </p>
                </div>
              ) : (
                // Otherwise, show the single download button
                <div className="invoice-item">
                  <div className="invoice-details">
                    <strong>Latest Invoice</strong>
                    <span>(For all purchases)</span>
                  </div>
                  <button 
                    className="submit-button"
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Generating...' : 'Download'}
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;