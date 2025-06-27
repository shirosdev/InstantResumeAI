// frontend/src/pages/Login.jsx - Updated with Password Reset Integration

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationMessageType, setLocationMessageType] = useState('');

  // Handle messages from password reset flow
  useEffect(() => {
    if (location.state?.message) {
      setLocationMessage(location.state.message);
      setLocationMessageType(location.state.messageType || 'info');
      
      // Clear the location state to prevent message persistence
      window.history.replaceState({}, document.title);
      
      // Auto-clear message after 5 seconds
      setTimeout(() => {
        setLocationMessage('');
        setLocationMessageType('');
      }, 5000);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.login || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(formData.login, formData.password);
      if (result.success) {
        // Clear any location messages on successful login
        setLocationMessage('');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-description">
          Sign in to continue enhancing your resume with AI-powered optimization
        </p>
        
        {/* Location-based messages (from password reset flow) */}
        {locationMessage && (
          <div className={locationMessageType === 'success' ? 'success-message' : 'auth-error'}>
            {locationMessage}
          </div>
        )}
        
        {/* Standard error messages */}
        {(error || authError) && !locationMessage && (
          <div className="auth-error">
            {error || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Email or Username</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Enter your email or username"
              autoComplete="username"
              disabled={isSubmitting || loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting || loading}
              required
            />
          </div>
          
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
        
        {/* Additional help section */}
        <div className="login-help" style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(125, 211, 201, 0.05)',
          border: '1px solid rgba(125, 211, 201, 0.2)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center'
        }}>
          <p><strong>Need Help?</strong></p>
          <p>
            You can sign in with either your <strong>email address</strong> or <strong>username</strong>. 
            If you've forgotten your password, use the "Forgot Password?" link above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;