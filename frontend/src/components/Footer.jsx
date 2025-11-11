import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>InstantResumeAI</h3>
            <p>Smarter resumes. Better opportunities</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><Link to="/usage">Usage Policy</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Address: 5080 Spectrum Drive,</p>
            <p>Suite 575E, Addison TX 75001</p>
            <p>Email: info@instantresumeai.com</p>
            <p>Phone: (800) 971-8013</p>
            
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 InstantResumeAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;