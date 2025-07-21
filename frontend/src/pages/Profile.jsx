// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Profile.css';

const Profile = () => {
  const { user, logout, updateUserData } = useAuth();
  const navigate = useNavigate();

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
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Account Type</h3>
            <p className="stat-status">Free Unlimited</p>
            <p className="stat-description">Development Phase</p>
          </div>
          <div className="stat-card">
            <h3>Member Since</h3>
            <p className="stat-date">
              {user ? new Date(user.created_at).toLocaleDateString() : '...'}
            </p>
            <p className="stat-description">Account creation date</p>
          </div>
          <div className="stat-card">
            <h3>Resumes Enhanced</h3>
            <p className="stat-number">0</p>
            <p className="stat-description">Total enhancements</p>
          </div>
        </div>

        <div className="auth-card profile-form-container" style={{ maxWidth: '680px', margin: '2rem auto' }}>
          <h2>Profile Information</h2>
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