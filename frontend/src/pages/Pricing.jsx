// frontend/src/pages/Pricing.jsx - Updated without FAQ Section

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Pricing.css';

const Pricing = () => {
  const { user } = useAuth();

  const features = [
    { name: 'Resume Enhancements', basic: '3 per day', active: '5 per day', pro: 'Unlimited' },
    { name: 'Validity', basic: '7 days', active: 'Monthly', pro: 'N/A' },
    { name: 'Pages per Resume', basic: '4 pages', active: '8 pages', pro: 'No limit' },
    { name: 'JD Word Limit', basic: '300 words', active: 'Unlimited', pro: 'Unlimited' },
    { name: 'Preview', basic: 'Not available', active: 'Not available', pro: 'available' },
    { name: 'Resume Download', basic: 'Enabled', active: 'Enabled', pro: 'Enabled' },
    { name: 'Subscription Required', basic: 'No', active: 'Optional', pro: 'Yes' },
  ];

  const basicFeatures = [
    { name: 'Resume Enhancements', basic: '3 per day', active: '5 per day', pro: 'Unlimited' },
    { name: 'Validity', basic: '7 days', active: 'Monthly', pro: 'Unlimited' },
    { name: 'Pages per Resume', basic: '4 pages', active: '8 pages', pro: 'No limit' },
    { name: 'JD Word Limit', basic: '300 words', active: 'Unlimited', pro: 'Unlimited' },
    { name: 'Preview', basic: 'available', active: 'Not available', pro: 'Enabled' },
    { name: 'Resume Download', basic: 'Enabled', active: 'Enabled', pro: 'Enabled' },
    { name: 'Subscription Required', basic: 'No', active: 'Optional', pro: 'Yes' },
  ];

  const activeFeatures = [
    { name: 'Resume Enhancements', basic: '3 per day', active: '5 per day', pro: 'Unlimited' },
    { name: 'Validity', basic: '7 days', active: 'N/A', pro: 'Unlimited' },
    { name: 'Pages per Resume', basic: '4 pages', active: '8 pages', pro: 'No limit' },
    { name: 'JD Word Limit', basic: '300 words', active: 'Unlimited', pro: 'Unlimited' },
    { name: 'Preview', basic: 'Not available', active: 'available', pro: 'Enabled' },
    { name: 'Resume Download', basic: 'Enabled', active: 'Enabled', pro: 'Enabled' },
    { name: 'Subscription Required', basic: 'No', active: '$499/month', pro: 'Yes' },
  ];

  return (
    <div className="pricing-container">
      <div className="container">
        <h1 className="pricing-title">Choose Your Plan</h1>
        <p className="pricing-subtitle">
          Select the perfect plan for your career needs
        </p>

        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="card-header">
              <div className="plan-badge">BASIC/TRIAL</div>
              <h2>Free Plan</h2>
              <p className="plan-description">Best for first-time users and quick trials</p>
              <div className="plan-price">
                <span className="amount">$0</span>
              </div>
              {user ? (
                <Link to="/" className="plan-button active">Current Plan</Link>
              ) : (
                <Link to="/signup" className="plan-button">Get Started Free</Link>
              )}
            </div>
            <div className="card-features">
              <ul>
                {basicFeatures.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-value">{feature.basic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pricing-card">
            <div className="card-header">
              <div className="plan-badge">Standard Model</div>
              <h2>Monthly</h2>
              <p className="plan-description">Ideal for professionals applying regularly</p>
              <div className="plan-price">
                <span className="amount">$499</span>
                <span className="period">/month</span>
              </div>
              <button className="plan-button">Get Started</button>
            </div>
            <div className="card-features">
              <ul>
                {activeFeatures.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-value">{feature.active}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pricing-card">
            <div className="card-header">
              <div className="plan-badge">PRO</div>
              <h2>All Access</h2>
              <p className="plan-description">For high-volume users and business</p>
              <div className="plan-price">
                <span className="amount">Call us</span>
              </div>
              <button className="plan-button">Get Started</button>
            </div>
            <div className="card-features">
              <ul>
                {features.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-value">{feature.pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;