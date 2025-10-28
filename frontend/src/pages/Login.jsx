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
  const [showPassword, setShowPassword] = useState(false);

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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting || loading}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#888'
                }}
              >
                {showPassword ? (
                  // Eye open SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  // Eye closed SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.06M1 1l22 22"></path><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03"></path></svg>
                )}
              </button>
            </div>
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
        <div className="login-help"> {/* style prop removed */}
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