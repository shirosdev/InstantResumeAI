// frontend/src/pages/ForgotPassword.jsx

// frontend/src/pages/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordResetService from '../services/passwordResetService';

// Use the same configuration pattern as VerifyResetToken for consistency
const expiryMinutes = parseInt(process.env.REACT_APP_RESET_TOKEN_EXPIRY_MINUTES, 10) || 5;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!formData.email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }
    
    if (!PasswordResetService.validateEmail(formData.email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.requestPasswordReset(formData.email);
      
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        setEmailSent(true);
        
        // Store email for next step
        sessionStorage.setItem('reset_email', formData.email);
        
        // Auto-redirect to verification after 3 seconds
        setTimeout(() => {
          navigate('/verify-reset-token');
        }, 3000);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToVerification = () => {
    navigate('/verify-reset-token');
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.requestPasswordReset(formData.email);
      if (result.success) {
        setMessage('Verification code resent successfully');
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setMessage('Failed to resend email. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Your Password</h2>
        <p className="auth-description">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
        
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'auth-error'}>
            {message}
          </div>
        )}
        
        {!emailSent ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your registered email address"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <div className="email-sent-confirmation">
            <div className="verification-status">
              <div className="status-item">
                <div className="status-icon">✓</div>
                <div className="status-content">
                  <div className="status-title">Reset instructions have been sent to your email address.</div>
                </div>
              </div>
              
              <div className="status-item">
                <div className="status-icon">✓</div>
                <div className="status-content">
                  <div className="status-title">Verification code sent!</div>
                  <div className="status-description">
                    We've sent a 6-digit verification code to <strong>{formData.email}</strong>
                  </div>
                </div>
              </div>

              <div className="timer-container">
                <div className="timer-display">
                  The code will expire in {expiryMinutes} minutes for security.
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={handleProceedToVerification}
                className="auth-button"
                style={{ marginBottom: '1rem' }}
              >
                Enter Verification Code
              </button>
              
              <button 
                onClick={handleResendEmail}
                className="auth-button secondary"
                disabled={loading}
              >
                {loading ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        )}
        
        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
        
        <div className="auth-footer" style={{ marginTop: '1rem' }}>
          Don't have an account? <Link to="/signup">Create Account</Link>
        </div>
        
        {emailSent && (
          <div className="security-notice" style={{ 
            marginTop: '2rem', 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            <p><strong>Security Notice:</strong> If you don't receive the email within a few minutes, please check your spam folder. If you still don't see it, try resending the code.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;