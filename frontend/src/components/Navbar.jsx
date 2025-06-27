// frontend/src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png'; // You'll need to add your logo

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen(false);
    
    // First logout
    await logout();
    
    // Then navigate using React Router
    navigate('/', { replace: true });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="InstantResumeAI" className="navbar-logo" />
        </Link>
        
        <ul className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {user ? (
            // Authenticated user navigation
            <>
              <li>
                <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Pricing
                </Link>
              </li>
              <li>
                <span className="user-greeting">
                  Hi, {user.first_name || user.username}
                </span>
              </li>
              <li>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            // Public navigation
            <>
              <li>
                <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="nav-link register-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
        
        <button className="mobile-nav-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;