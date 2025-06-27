// frontend/src/pages/Dashboard.jsx - Updated with Reorganized Card Layout

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

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
            <p className="stat-number">0</p>
            <p className="stat-description">Total resumes enhanced</p>
          </div>
          <div className="stat-card">
            <h3>Subscription Status</h3>
            <p className="stat-status">Free Plan</p>
            <p className="stat-description">Trial Period</p>
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
            <p>Check your previous resume enhancements and download them</p>
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