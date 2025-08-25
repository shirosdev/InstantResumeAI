// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Profile.css';

const Profile = () => {
  // --- MODIFICATION START ---
  // 1. Get userStatus, loading state, and fetchUserStatus from the useAuth hook.
  const { user, logout, updateUserData, userStatus, loading: authLoading, fetchUserStatus } = useAuth();
  // --- MODIFICATION END ---
  
  const navigate = useNavigate();

  // This old state is no longer needed, as userStatus provides the data.
  // const [enhancementCount, setEnhancementCount] = useState(0);
  // const [isLoadingStats, setIsLoadingStats] = useState(true);

  // State for the form (This is your original, preserved code)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    profession: '',
    location: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Effect to populate form data (This is your original, preserved code)
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        profession: user.profession || '',
        location: user.location || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // --- MODIFICATION START ---
  // 2. This useEffect now calls fetchUserStatus to get the latest subscription data.
  // The old, incorrect call to getUserStats() is removed.
  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);
  // --- MODIFICATION END ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        profession: user.profession || '',
        location: user.location || '',
        bio: user.bio || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      if (updateUserData && response.data.user) {
        updateUserData(response.data.user);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>My Profile</h1>
        
        {/* --- MODIFICATION START --- */}
        {/* 3. The stat cards now use the live data from userStatus. */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Account Type</h3>
            <p className="stat-status">
              {authLoading || !userStatus ? 'Loading...' : userStatus.plan_name}
            </p>
            <p className="stat-description">Current subscription plan</p>
          </div>
          <div className="stat-card">
            <h3>Enhancements Left</h3>
            <p className="stat-number">
              {authLoading || !userStatus ? '...' : 
                userStatus.remaining_enhancements === 'unlimited' ? '∞' : userStatus.remaining_enhancements
              }
            </p>
            <p className="stat-description">Credits remaining</p>
          </div>
          <div className="stat-card">
            <h3>Resumes Enhanced</h3>
            <p className="stat-number">
              {authLoading || !userStatus ? '...' : userStatus.enhancement_count}
            </p>
            <p className="stat-description">Total enhancements used</p>
          </div>
        </div>
        {/* --- MODIFICATION END --- */}

        <div className="auth-card profile-form-container" style={{ maxWidth: '680px', margin: '2rem auto' }}>
          <h2>Profile Information</h2>
          {/* Your entire form and its logic are preserved below, untouched. */}
          <form onSubmit={handleSubmit}>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="form-grid">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={user?.username || ''} disabled />
                </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label>Profession</label>
                <input 
                  type="text" 
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="City, State/Country"
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows="3"
              />
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    className="auth-button secondary"
                    onClick={handleCancelClick}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="auth-button" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="auth-button"
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                  <button 
                    type="button"
                    className="auth-button danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;