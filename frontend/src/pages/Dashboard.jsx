// frontend/src/pages/Dashboard.jsx

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, userStatus, loading, fetchUserStatus } = useAuth();

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  // --- NEW: Helper to format the reset date ---
  const getResetDate = () => {
    if (!userStatus || !userStatus.credits_reset_date) return null;
    try {
      const date = new Date(userStatus.credits_reset_date);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } catch (e) {
      return null;
    }
  };
  const resetDate = getResetDate();
  // --- END NEW HELPER ---

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user.first_name || user.username}!</h1>
          <p className="dashboard-subtitle">
            Ready to enhance your resume with AI-powered optimization?
          </p>
        </div>

        <div className="dashboard-stats">
          
          {/* --- THIS IS THE UPDATED STAT CARD --- */}
          <div className="stat-card">
            <h3>Enhancement Credits</h3>
            {loading || !userStatus ? (
              <div className="stat-number">...</div>
            ) : (
              <>
                <div className="stat-card-split">
                  <div className="stat-item">
                    {/* Shows Plan Credits: e.g., 30 / 30 */}
                    <p className="stat-number">
                      {userStatus.remaining_plan_credits}
                      <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        {' '}/ {userStatus.plan_credit_limit}
                      </span>
                    </p>
                    <p className="stat-description">
                      Plan Credits
                      {resetDate && (
                        <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '2px' }}>
                          (Resets {resetDate})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="stat-item">
                    {/* Shows Top-Up Credits: e.g., 5 */}
                    <p className="stat-number">
                      {userStatus.purchased_credits}
                    </p>
                    <p className="stat-description">
                      Top-Up Credits
                      <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '2px' }}>
                        (Never Expire)
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Link to="/top-up" style={{ 
                      color: 'var(--text-accent)',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                    Purchase More Credits
                  </Link>
                </div>
              </>
            )}
          </div>
          {/* --- END OF UPDATED STAT CARD --- */}

          <div className="stat-card">
            <h3>Subscription Status</h3>
            {/* This will now show "Starter (+ 5 Top-up)" if they have top-ups */}
            <p className="stat-status">{loading || !userStatus ? '...' : userStatus.plan_name}</p>
            <p className="stat-description">Current subscription plan</p>
          </div>
          <div className="stat-card">
            <h3>Member Since</h3>
            <p className="stat-date">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="stat-description">Account creation date</p>
          </div>
        </div>

        {/* --- Action cards remain the same --- */}
        <div className="dashboard-actions">
          <div className="action-card">
            <h2>View History</h2>
            <p>Review a log of your 5 most recent resume enhancements</p>
            <Link to="/history" className="action-button secondary">
              View History
            </Link>
          </div>
          <div className="action-card">
            <h2>Enhance Your Resume</h2>
            <p>Upload your resume and job description to get AI-powered enhancements</p>
            <Link to="/" className="action-button">
              Start Enhancing
            </Link>
          </div>
          <div className="action-card">
            <h2>Billing Info</h2>
            <p>Review your current plan and download invoices.</p>
            <Link to="/billing" className="action-button secondary">
              Manage Billing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;