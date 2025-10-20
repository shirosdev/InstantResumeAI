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
          <div className="stat-card">
            <h3>Enhancement Credits</h3>
            <div className="stat-card-split">
              <div className="stat-item">
                <p className="stat-number">
                  {loading || !userStatus ? '...' : userStatus.enhancement_count}
                </p>
                <p className="stat-description">Used</p>
              </div>
              <div className="stat-item">
                <p className="stat-number">
                  {loading || !userStatus ? '...' :
                    userStatus.remaining_enhancements === 'unlimited' ? '∞' : userStatus.remaining_enhancements
                  }
                </p>
                <p className="stat-description">Remaining</p>
              </div>
            </div>
            {/* --- START OF NEW CODE --- */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link to="/top-up" style={{ 
                  color: 'var(--bio-luminescent)', 
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                Purchase More Credits
              </Link>
            </div>
            {/* --- END OF NEW CODE --- */}
          </div>
          <div className="stat-card">
            <h3>Subscription Status</h3>
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
            <h2>Account Settings</h2>
            <p>Update your profile information and preferences</p>
            <Link to="/profile" className="action-button secondary">
              Manage Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;