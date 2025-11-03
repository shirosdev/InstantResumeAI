// src/pages/admin/AdminActions.jsx

import React, { useState } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css'; // Reusing styles

const AdminActions = () => {
  // State for Manual Credit Adjustment
  const [userId, setUserId] = useState('');
  const [credits, setCredits] = useState('');
  const [reason, setReason] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState('');
  const [creditSuccess, setCreditSuccess] = useState('');

  // State for Maintenance Actions
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState('');
  
  // --- NEW: State for Webhook Test ---
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState('');
  // --- END NEW STATE ---

  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastError, setBroadcastError] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    setCreditLoading(true);
    setCreditError('');
    setCreditSuccess('');

    const creditsFloat = parseFloat(credits);
    if (!userId || !credits || isNaN(creditsFloat) || creditsFloat === 0 || !Number.isInteger(creditsFloat)) {
      setCreditError('Please provide a valid User ID and a non-zero whole number of credits (e.g., 10 or -5). Decimals are not allowed.');
      setCreditLoading(false);
      return;
    }

    try {
      const res = await adminService.manualAddCredits(userId, creditsFloat, reason || 'Manual credit addition');
      const creditsChanged = res.data.new_credits - res.data.old_credits;
      const actionWord = creditsChanged > 0 ? 'added' : 'removed';
      setCreditSuccess(`Successfully ${actionWord} ${Math.abs(creditsChanged)} credits for user ${userId}. New total: ${res.data.new_credits}`);
      setUserId('');
      setCredits('');
      setReason('');
    } catch (err) {
      setCreditError(err.response?.data?.message || 'Failed to add credits.');
    } finally {
      setCreditLoading(false);
    }
  };

  const handleTokenCleanup = async () => {
    setTokenLoading(true);
    setTokenResult('');
    try {
      const res = await adminService.cleanupExpiredTokens();
      setTokenResult(`Success: ${res.data.message}`);
    } catch (err) {
      setTokenResult(`Error: ${err.response?.data?.message || 'Failed to run cleanup.'}`);
    } finally {
      setTokenLoading(false);
    }
  };

  // --- NEW: Handler for Webhook Check ---
  const handleWebhookCheck = async () => {
    setWebhookLoading(true);
    setWebhookResult('');
    try {
      const res = await adminService.checkWebhook();
      setWebhookResult(`Success: ${res.data.message} (Timestamp: ${res.data.timestamp})`);
    } catch (err) {
      setWebhookResult(`Error: ${err.response?.data?.message || 'Failed to reach webhook.'}`);
    } finally {
      setWebhookLoading(false);
    }
  };
  // --- END NEW HANDLER ---

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setBroadcastError('');
    setBroadcastSuccess('');

    if (!broadcastSubject || !broadcastMessage) {
      setBroadcastError('Subject and Message are required.');
      setBroadcastLoading(false);
      return;
    }

    // Confirmation dialog
    if (!window.confirm("Are you sure you want to send this message to ALL active users? This action cannot be undone.")) {
      setBroadcastLoading(false);
      return;
    }

    try {
      const res = await adminService.sendBroadcastEmail(broadcastSubject, broadcastMessage);
      setBroadcastSuccess(res.data.message);
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err) {
      setBroadcastError(err.response?.data?.message || 'Failed to send broadcast.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Admin Actions</h1>
      </div>

      {/* Manual Credit Adjustment Card (Existing) */}
      <div className="admin-table-container admin-action-card">
        <h3>Manual Credit Adjustment</h3>
        <p className="admin-action-description">
          Manually add or remove enhancement credits for a specific user. Use a positive number to add credits and a negative number (e.g., -5) to remove them.
        </p>

        {creditLoading && <LoadingSpinner message="Processing..." />}
        {creditError && <div className="error-message" style={{textAlign: 'center'}}>{creditError}</div>}
        {creditSuccess && <div className="success-message" style={{textAlign: 'center'}}>{creditSuccess}</div>}
        
        <form onSubmit={handleCreditSubmit} className="action-form-grid">
          <div className="form-group">
            <label htmlFor="user-id">User ID</label>
            <input type="number" id="user-id" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter User ID (e.g., 123)" disabled={creditLoading} />
          </div>
          <div className="form-group">
            <label htmlFor="credits">Credits to Add/Remove</label>
            <input type="number" id="credits" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="e.g., 10 or -5" disabled={creditLoading} step="1" />
          </div>
          <div className="form-group reason-group">
            <label htmlFor="reason">Reason (Optional)</label>
            <input type="text" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Customer support grant" disabled={creditLoading} />
          </div>
          <div className="action-button-container">
            <button type="submit" className="action-button success" disabled={creditLoading}>
              {creditLoading ? 'Processing...' : 'Apply Credit Change'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-container admin-action-card">
        <h3>Broadcast Announcement</h3>
        <p className="admin-action-description">
          Send an email to ALL active users. Use with caution. You can use simple HTML (e.g., `&lt;strong&gt;Hi&lt;/strong&gt;`, `&lt;br&gt;`, `&lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;`).
        </p>

        {broadcastLoading && <LoadingSpinner message="Sending Broadcast..." />}
        {broadcastError && <div className="error-message" style={{textAlign: 'center'}}>{broadcastError}</div>}
        {broadcastSuccess && <div className="success-message" style={{textAlign: 'center'}}>{broadcastSuccess}</div>}
        
        <form onSubmit={handleBroadcastSubmit} className="action-form-vertical">
          <div className="form-group">
            <label htmlFor="broadcast-subject">Subject</label>
            <input
              type="text"
              id="broadcast-subject"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="e.g., Important Service Update"
              disabled={broadcastLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="broadcast-message">Message (HTML)</label>
            <textarea
              id="broadcast-message"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="<p>We will be undergoing scheduled maintenance...</p>"
              disabled={broadcastLoading}
              rows="8"
            />
          </div>
          <div className="action-button-container-right">
            <button 
              type="submit" 
              className="action-button danger"
              disabled={broadcastLoading}
            >
              {broadcastLoading ? 'Sending...' : 'Send Broadcast to All Users'}
            </button>
          </div>
        </form>
      </div>

      {/* System Maintenance Section (Updated) */}
      <h3 className="admin-section-title">System Maintenance & Diagnostics</h3>
      <div className="admin-action-grid">
        
        {/* Cleanup Tokens Card (Existing) */}
        <div className="admin-table-container admin-action-card utility">
          <div className="action-card-content">
            <h3>Cleanup Expired Tokens</h3>
            <p>
              Run the maintenance job to delete expired password reset tokens from the database.
              This is a non-destructive operation.
            </p>
            {tokenResult && (
              <div className={tokenResult.startsWith('Error') ? 'error-message' : 'success-message'} style={{textAlign: 'center', margin: '1rem 0 0 0'}}>
                {tokenResult}
              </div>
            )}
          </div>
          <div className="action-card-button">
            <button className="action-button secondary" onClick={handleTokenCleanup} disabled={tokenLoading}>
              {tokenLoading ? 'Cleaning...' : 'Run Cleanup'}
            </button>
          </div>
        </div>

        {/* --- NEW: Webhook Test Card --- */}
        <div className="admin-table-container admin-action-card utility">
          <div className="action-card-content">
            <h3>Check Stripe Webhook</h3>
            <p>
              Ping the Stripe webhook test endpoint to ensure it's publicly reachable by Stripe.
            </p>
            {webhookResult && (
              <div className={webhookResult.startsWith('Error') ? 'error-message' : 'success-message'} style={{textAlign: 'center', margin: '1rem 0 0 0'}}>
                {webhookResult}
              </div>
            )}
          </div>
          <div className="action-card-button">
            <button className="action-button secondary" onClick={handleWebhookCheck} disabled={webhookLoading}>
              {webhookLoading ? 'Pinging...' : 'Run Check'}
            </button>
          </div>
        </div>
        {/* --- END NEW CARD --- */}

      </div>
    </div>
  );
};

export default AdminActions;