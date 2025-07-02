// frontend/src/pages/VerifyResetToken.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordResetService from '../services/passwordResetService';

const expiryMinutes = parseInt(process.env.REACT_APP_RESET_TOKEN_EXPIRY_MINUTES, 10) || 5;
const expirySeconds = expiryMinutes * 60;

const VerifyResetToken = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    token: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const tokenInputRef = useRef(null);

  useEffect(() => {
    const initializeComponent = () => {
      const storedEmail = sessionStorage.getItem('reset_email');
      if (storedEmail) {
        setFormData(prev => ({ ...prev, email: storedEmail }));
        setIsInitialized(true);
      } else {
        navigate('/forgot-password');
        return;
      }
    };

    initializeComponent();
  }, [navigate]);

  useEffect(() => {
    if (!isInitialized) return;

    if (tokenInputRef.current) {
      tokenInputRef.current.focus();
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInitialized]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'token') {
      const formattedValue = PasswordResetService.formatVerificationCode(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setMessage('Email address is required');
      setMessageType('error');
      return;
    }
    
    if (!formData.token.trim()) {
      setMessage('Please enter the verification code');
      setMessageType('error');
      return;
    }
    
    if (formData.token.length !== 6) {
      setMessage('Verification code must be 6 digits');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.verifyResetToken(formData.email, formData.token);
      
      if (result.success && result.valid) {
        setMessage('Verification successful! Redirecting...');
        setMessageType('success');
        sessionStorage.setItem('verified_token', formData.token);
        
        setTimeout(() => {
          navigate('/reset-password');
        }, 1500);
      } else {
        setMessage(result.message || 'Invalid verification code');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setMessage('');
    
    try {
      const result = await PasswordResetService.requestPasswordReset(formData.email);
      
      if (result.success) {
        setMessage('New verification code sent successfully');
        setMessageType('success');
        setTimeLeft(expirySeconds);
        setFormData(prev => ({ ...prev, token: '' }));
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to resend code. Please try again.');
      setMessageType('error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToEmail = () => {
    sessionStorage.removeItem('reset_email');
    navigate('/forgot-password');
  };

  if (!isInitialized) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Enter Verification Code</h2>
          <p className="auth-description">
            We've sent a 6-digit verification code to <strong>{formData.email}</strong>
          </p>
        </div>

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
                We've sent a 6-digit verification code to {formData.email}
              </div>
            </div>
          </div>

          <div className="timer-container">
            <div className={`timer-display ${timeLeft <= 300 ? 'timer-warning' : ''}`}>
              {timeLeft > 0 ? (
                <>Code expires in: {formatTime(timeLeft)}</>
              ) : (
                <>Code has expired. Please request a new one.</>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`auth-message ${messageType === 'success' ? 'success-message' : 'auth-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label htmlFor="token">Verification Code</label>
            <input
              ref={tokenInputRef}
              type="text"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="token-input"
              disabled={loading || timeLeft === 0}
              required
            />
            <div className="input-help">
              Enter the 6-digit code from your email
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || timeLeft === 0 || formData.token.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="resend-section">
          <p className="resend-text">Didn't receive the code?</p>

          <button
            onClick={handleResendCode}
            className="auth-button secondary"
            disabled={resendLoading || timeLeft > expirySeconds - 60}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </button>

          {timeLeft > expirySeconds - 60 && (
            <p className="resend-timer">
              You can resend the code in {Math.ceil((timeLeft - (expirySeconds - 60)) / 60)} minute(s)
            </p>
          )}
        </div>

        <div className="auth-navigation">
          <div className="auth-footer">
            <button onClick={handleBackToEmail} className="link-button">
              Use different email
            </button>
          </div>

          <div className="auth-footer">
            Remember your password? <Link to="/login">Sign In</Link>
          </div>
        </div>

        <div className="security-notice">
          <p>
            Check your spam folder if you don't see the email. The verification code is valid for {expiryMinutes} minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetToken;