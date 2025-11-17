// frontend/src/pages/Dashboard.jsx

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';
// Make sure ResumeEnhancement.css is imported for the button styles
import '../styles/ResumeEnhancement.css'; 

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
            {/* RECTIFIED: Changed from text link to button style */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link 
                to="/top-up" 
                className="submit-button secondary"
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  fontSize: '0.9rem', 
                  width: 'auto', 
                  display: 'inline-flex' 
                }}
              >
                Purchase More Credits
              </Link>
            </div>
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