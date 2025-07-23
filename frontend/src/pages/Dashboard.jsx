// frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import authService from '../services/authService'; // Import the service
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [enhancementCount, setEnhancementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user stats when the component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authService.getUserStats();
        if (response.data?.stats) {
          setEnhancementCount(response.data.stats.enhancement_count);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        // Keep the count at 0 if there's an error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty dependency array means this runs once on mount

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
              {isLoading ? '...' : enhancementCount}
            </p>
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
          {/* ... (Your action cards remain the same) ... */}
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