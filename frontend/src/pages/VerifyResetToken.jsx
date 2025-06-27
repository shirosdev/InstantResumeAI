// frontend/src/pages/VerifyResetToken.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordResetService from '../services/passwordResetService';

const VerifyResetToken = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    token: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const tokenInputRef = useRef(null);

  useEffect(() => {
    // Get email from previous step or redirect if not found
    const storedEmail = sessionStorage.getItem('reset_email');
    if (storedEmail) {
      setFormData(prev => ({ ...prev, email: storedEmail }));
    } else {
      navigate('/forgot-password');
      return;
    }

    // Focus on token input
    if (tokenInputRef.current) {
      tokenInputRef.current.focus();
    }

    // Start countdown timer
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
  }, [navigate]);

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
    
    // Clear messages when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
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
        
        // Store verified token for password reset
        sessionStorage.setItem('verified_token', formData.token);
        
        // Redirect to password reset page
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
        setTimeLeft(900); // Reset timer to 15 minutes
        setFormData(prev => ({ ...prev, token: '' })); // Clear current token
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Enter Verification Code</h2>
        <p className="auth-description">
          We've sent a 6-digit verification code to <strong>{formData.email}</strong>
        </p>
        
        <div className="timer-display" style={{
          textAlign: 'center',
          margin: '1rem 0',
          padding: '0.8rem',
          background: timeLeft > 300 ? 'rgba(125, 211, 201, 0.1)' : 'rgba(255, 77, 109, 0.1)',
          borderRadius: '8px',
          color: timeLeft > 300 ? 'var(--bio-luminescent)' : 'var(--coral-primary)',
          fontWeight: '600'
        }}>
          {timeLeft > 0 ? (
            <>Code expires in: {formatTime(timeLeft)}</>
          ) : (
            <>Code has expired. Please request a new one.</>
          )}
        </div>
        
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'auth-error'}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
              style={{
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontWeight: '600'
              }}
              disabled={loading || timeLeft === 0}
              required
            />
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
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
        
        <div className="resend-section" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
            Didn't receive the code?
          </p>
          
          <button 
            onClick={handleResendCode}
            className="auth-button"
            disabled={resendLoading || timeLeft > 840} // Can resend after 1 minute
            style={{ 
              background: 'transparent', 
              border: '2px solid var(--bio-luminescent)', 
              color: 'var(--bio-luminescent)',
              marginBottom: '1rem'
            }}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </button>
          
          {timeLeft > 840 && (
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '0.5rem'
            }}>
              You can resend the code in {Math.ceil((timeLeft - 840) / 60)} minute(s)
            </p>
          )}
        </div>
        
        <div className="navigation-links" style={{ marginTop: '2rem' }}>
          <div className="auth-footer">
            <button 
              onClick={handleBackToEmail}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--bio-luminescent)', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit'
              }}
            >
              Use different email
            </button>
          </div>
          
          <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
            Remember your password? <Link to="/login">Sign In</Link>
          </div>
        </div>
        
        <div className="security-notice" style={{ 
          marginTop: '2rem', 
          fontSize: '0.85rem', 
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          <p>Check your spam folder if you don't see the email. The verification code is valid for 15 minutes.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetToken;