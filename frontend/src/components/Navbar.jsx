// frontend/src/components/Navbar.jsx
// --- UPDATED FILE ---

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

// Hook to detect desktop size
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-link" onClick={closeMobileMenu}>
          <img src={logo} alt="InstantResumeAI" className="navbar-logo" />
        </Link>
        <div className="navbar-actions">
          {user && (
            <span className="user-greeting-mobile">
              Hi, {user.first_name || user.username}
            </span>
          )}
          <button
            className="mobile-nav-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        <ul className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {user ? (
            // Authenticated user navigation
            <>
              <li>
                <Link to="/" className="nav-link" onClick={closeMobileMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="nav-link" onClick={closeMobileMenu}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/profile" className="nav-link" onClick={closeMobileMenu}>
                  Profile
                </Link>
              </li>
              
              {/* Desktop user greeting (only render on desktop) */}
              {isDesktop && (
                <li>
                  <span className="user-greeting">
                    Hi, {user.first_name || user.username}
                  </span>
                </li>
              )}
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
                <Link to="/" className="nav-link" onClick={closeMobileMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="nav-link" onClick={closeMobileMenu}>
                  How It Works
                </Link>
              </li>
              
              <li>
                <Link to="/pricing" className="nav-link" onClick={closeMobileMenu}>
                  Pricing
                </Link>
              </li>
              
              <li>
                <Link to="/investors" className="nav-link" onClick={closeMobileMenu}>
                  Investors
                </Link>
              </li>
              
              {/* --- THIS EMPTY LI HAS BEEN REMOVED --- */}
              
              <li>
                <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="nav-link register-link" onClick={closeMobileMenu}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;