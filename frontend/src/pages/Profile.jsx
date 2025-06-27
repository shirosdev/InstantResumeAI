import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone_number || '',
    profession: user?.profession || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log('Updating profile with:', formData);
    setIsEditing(false);
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
              {new Date(user?.created_at).toLocaleDateString()}
            </p>
            <p className="stat-description">Account creation date</p>
          </div>
          <div className="stat-card">
            <h3>Resumes Enhanced</h3>
            <p className="stat-number">0</p>
            <p className="stat-description">Total enhancements</p>
          </div>
        </div>

        <div className="auth-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <h2>Profile Information</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={user?.username || ''} disabled />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="form-group">
              <label>Profession</label>
              <input 
                type="text" 
                value={formData.profession}
                onChange={(e) => setFormData({...formData, profession: e.target.value})}
                disabled={!isEditing}
                placeholder="e.g. Software Engineer, Marketing Manager"
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={!isEditing}
                placeholder="City, State/Country"
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows="4"
                style={{ 
                  width: '100%', 
                  padding: '0.8rem 1rem',
                  border: '1px solid rgba(144, 241, 239, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(0, 18, 32, 0.8)',
                  color: 'white',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                {isEditing ? (
                  <>
                    <button type="submit" className="auth-button">Save Changes</button>
                    <button 
                      type="button" 
                      className="auth-button" 
                      style={{ marginLeft: '1rem', background: 'transparent', border: '2px solid var(--bio-luminescent)' }}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="auth-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              
              <button 
                type="button"
                className="auth-button"
                style={{ background: 'var(--coral-primary)' }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;