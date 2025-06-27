// frontend/src/pages/ResetPassword.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PasswordResetService from '../services/passwordResetService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token: urlToken } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    token: '',
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

  useEffect(() => {
    // Get email and token from previous steps or URL parameter
    const storedEmail = sessionStorage.getItem('reset_email');
    const storedToken = sessionStorage.getItem('verified_token') || urlToken;
    
    if (storedEmail && storedToken) {
      setFormData(prev => ({
        ...prev,
        email: storedEmail,
        token: storedToken
      }));
    } else {
      // Redirect if no valid token/email found
      navigate('/forgot-password');
    }
  }, [navigate, urlToken]);

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
    if (!formData.email.trim() || !formData.token.trim()) {
      setMessage('Invalid reset session. Please start over.');
      setMessageType('error');
      return;
    }
    
    if (!formData.newPassword) {
      setMessage('Please enter a new password');
      setMessageType('error');
      return;
    }
    
    if (!passwordValidation.isValid) {
      setMessage('Please ensure your password meets all requirements');
      setMessageType('error');
      setShowPasswordRequirements(true);
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.resetPassword(
        formData.email,
        formData.token,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (result.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setMessageType('success');
        
        // Clear stored data
        sessionStorage.removeItem('reset_email');
        sessionStorage.removeItem('verified_token');
        
        // Redirect to login page
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful. You can now log in with your new password.',
              messageType: 'success'
            }
          });
        }, 2000);
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
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="auth-description">
          Create a strong password for your InstantResumeAI account
        </p>
        
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'auth-error'}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
        
        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
        
        <div className="security-notice" style={{ 
          marginTop: '2rem', 
          fontSize: '0.85rem', 
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          <p><strong>Security Tip:</strong> Use a unique password that you don't use for other accounts. Consider using a password manager for better security.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;