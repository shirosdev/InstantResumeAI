// frontend/src/pages/Dashboard.jsx

import React, { useEffect } from 'react'; // Import useEffect
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  // We get ALL necessary data directly from the useAuth hook.
  const { user, userStatus, loading, fetchUserStatus } = useAuth();

  // FIX: Add this useEffect to fetch fresh data every time the dashboard is viewed
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
            <h3>Resume Enhancements</h3>
            <p className="stat-number">
              {/* This now correctly uses the data fetched by useAuth */}
              {loading || !userStatus ? '...' : userStatus.enhancement_count}
            </p>
            <p className="stat-description">Enhancements used this period</p>
          </div>
          <div className="stat-card">
            <h3>Subscription Status</h3>
            <p className="stat-status">{loading || !userStatus ? '...' : userStatus.plan_name}</p>
            <p className="stat-description">
              {loading || !userStatus ? '...' : 
                userStatus.resume_limit === null ? 'Unlimited Enhancements' : 
                `${userStatus.remaining_enhancements} Enhancements Left`
              }
            </p>
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