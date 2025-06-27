// frontend/src/pages/ChangePassword.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordResetService from '../services/passwordResetService';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    requirements: {},
    errors: []
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate password in real-time
    if (name === 'newPassword') {
      const validation = PasswordResetService.validatePassword(value);
      setPasswordValidation(validation);
    }
    
    // Clear messages when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.currentPassword) {
      setMessage('Please enter your current password');
      setMessageType('error');
      return;
    }
    
    if (!formData.newPassword) {
      setMessage('Please enter a new password');
      setMessageType('error');
      return;
    }
    
    if (!passwordValidation.isValid) {
      setMessage('Please ensure your new password meets all requirements');
      setMessageType('error');
      setShowPasswordRequirements(true);
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      return;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setMessage('New password must be different from your current password');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (result.success) {
        setMessage('Password changed successfully!');
        setMessageType('success');
        setChangeSuccess(true);
        
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!formData.newPassword) return 'transparent';
    if (passwordValidation.isValid) return 'var(--bio-luminescent)';
    
    const validCount = Object.values(passwordValidation.requirements).filter(Boolean).length;
    if (validCount >= 4) return 'var(--thermal-vent)';
    return 'var(--coral-primary)';
  };

  const getPasswordStrengthWidth = () => {
    if (!formData.newPassword) return '0%';
    const validCount = Object.values(passwordValidation.requirements).filter(Boolean).length;
    return `${(validCount / 5) * 100}%`;
  };

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Change Password</h1>
          <p className="dashboard-subtitle">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--bio-luminescent)', marginBottom: '0.5rem' }}>
              Security Settings
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
              Account: <strong>{user?.email}</strong>
            </p>
          </div>
          
          {message && (
            <div className={messageType === 'success' ? 'success-message' : 'auth-error'}>
              {message}
            </div>
          )}
          
          {!changeSuccess ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onFocus={() => setShowPasswordRequirements(true)}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                
                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="password-strength" style={{ marginTop: '0.5rem' }}>
                    <div 
                      className="password-strength-bar"
                      style={{
                        width: getPasswordStrengthWidth(),
                        backgroundColor: getPasswordStrengthColor(),
                        height: '4px',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Password Requirements */}
              {showPasswordRequirements && formData.newPassword && (
                <div className="password-requirements" style={{
                  background: 'rgba(125, 211, 201, 0.1)',
                  border: '1px solid rgba(125, 211, 201, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: 'var(--bio-luminescent)' }}>
                    Password Requirements:
                  </div>
                  {[
                    { key: 'minLength', text: 'At least 8 characters' },
                    { key: 'hasUppercase', text: 'One uppercase letter' },
                    { key: 'hasLowercase', text: 'One lowercase letter' },
                    { key: 'hasNumber', text: 'One number' },
                    { key: 'hasSpecialChar', text: 'One special character' }
                  ].map(({ key, text }) => (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: passwordValidation.requirements[key] ? 'var(--bio-luminescent)' : 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '0.25rem'
                    }}>
                      <span>{passwordValidation.requirements[key] ? '✓' : '○'}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: formData.newPassword === formData.confirmPassword ? 'var(--bio-luminescent)' : 'var(--coral-primary)'
                  }}>
                    {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={loading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
                  style={{ flex: 1, maxWidth: '200px' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                
                <Link 
                  to="/dashboard"
                  className="auth-button"
                  style={{ 
                    flex: 1, 
                    maxWidth: '200px',
                    background: 'transparent', 
                    border: '2px solid var(--bio-luminescent)', 
                    color: 'var(--bio-luminescent)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : (
            <div className="change-success" style={{ textAlign: 'center' }}>
              <div className="success-message">
                <strong>✓ Password Changed Successfully!</strong>
                <p>Your password has been updated. You will be redirected to your dashboard shortly.</p>
              </div>
              
              <div style={{ marginTop: '2rem' }}>
                <Link 
                  to="/dashboard"
                  className="auth-button"
                  style={{ textDecoration: 'none' }}
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
          
          <div className="security-tips" style={{ 
            marginTop: '2rem', 
            padding: '1.5rem',
            background: 'rgba(139, 126, 216, 0.1)',
            border: '1px solid rgba(139, 126, 216, 0.3)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <h4 style={{ color: 'var(--abyssal-purple)', marginBottom: '1rem' }}>
              🔐 Security Best Practices
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Use a unique password that you don't use elsewhere</li>
              <li>Consider using a password manager</li>
              <li>Enable two-factor authentication when available</li>
              <li>Change your password regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;