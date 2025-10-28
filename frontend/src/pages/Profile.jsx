// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Profile.css';
import '../styles/Dashboard.css';

const Profile = () => {
  const { user, logout, updateUserData, userStatus, loading: authLoading, fetchUserStatus } = useAuth();
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

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

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
        <div className="profile-page-header">
          <h1>My Profile</h1>
          {user && user.is_admin && (
            <Link to="/admin" className="admin-header-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span>Admin Panel</span>
          </Link>
          )}
        </div>

        <div className="auth-card profile-form-container" style={{ maxWidth: '680px', margin: '2rem auto' }}>
          <h2>Profile Information</h2>
          <form onSubmit={handleSubmit}>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* --- Form Fields --- */}
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
            {/* --- End Form Fields --- */}

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="auth-button secondary" /* Still uses auth-button style */
                    onClick={handleCancelClick}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="auth-button" disabled={isLoading}> {/* Primary auth-button style */}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="auth-button" /* Primary auth-button style */
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                  {/* --- THE ONLY CHANGE IS HERE --- */}
                  <button
                    type="button"
                    className="profile-logout-button" /* Use ONLY the unique class */
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  {/* --- END CHANGE --- */}
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