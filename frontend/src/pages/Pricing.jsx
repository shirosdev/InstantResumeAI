// frontend/src/pages/Pricing.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Pricing.css';

const Pricing = () => {
  const { user } = useAuth();

  // DATA MATCHING YOUR DATABASE EXACTLY
  const plans = [
    {
      id: 1, 
      name: 'Freemium',
      description: 'Perfect for getting started and trying out the basics.',
      price: '$0',
      period: '',
      badge: 'FREE',
      features: [
        { label: 'Max Enhancements', value: '10 / month' },
        { label: 'Resume Preview', value: 'No' },
        { label: 'Resume Download', value: 'Yes' }
      ],
      buttonText: user ? 'Current Plan' : 'Get Started',
      buttonLink: user ? '/dashboard' : '/signup',
      buttonState: null,
      buttonClass: user ? 'plan-button active' : 'plan-button',
      isRecommended: false
    },
    {
      id: 2, // MATCHES DATABASE ID FOR STARTER
      name: 'Starter',
      description: 'For job seekers applying to multiple roles.',
      price: '$12',
      period: '/month',
      badge: 'PAID',
      features: [
        { label: 'Max Enhancements', value: '30 / month' },
        { label: 'Enable Preview', value: 'Yes' },
        { label: 'Resume Download', value: 'Yes' },
        { label: 'Limited ATS', value: 'Yes' }
      ],
      buttonText: 'Choose Starter',
      buttonLink: '/checkout',
      // Pass numeric ID in state
      buttonState: { 
        purchaseType: 'subscription', 
        item: { id: 2, name: 'Starter', price: 12, features: [{value: '30 Enhancements'}] } 
      },
      buttonClass: 'plan-button',
      isRecommended: false
    },
    {
      id: 3, // MATCHES DATABASE ID FOR PRO
      name: 'Pro',
      description: 'For power users and professionals.',
      price: '$24',
      period: '/month',
      badge: 'PAID',
      features: [
        { label: 'Max Enhancements', value: '100 / month' },
        { label: 'Enable Preview', value: 'Yes' },
        { label: 'Full ATS', value: 'Yes' },
        { label: 'Resume Match', value: 'Yes' }
      ],
      buttonText: 'Choose Pro',
      buttonLink: '/checkout',
      // Pass numeric ID in state
      buttonState: { 
        purchaseType: 'subscription', 
        item: { id: 3, name: 'Pro', price: 24, features: [{value: '100 Enhancements'}] } 
      },
      buttonClass: 'plan-button',
      isRecommended: true 
    },
    {
      id: 4, 
      name: 'Enterprise',
      description: 'Custom solutions for teams and businesses.',
      price: 'Contact Us',
      period: '',
      badge: 'PAID',
      features: [
        { label: 'Max Enhancements', value: 'Custom' },
        { label: 'Features', value: 'Customised' },
        { label: 'Dedicated Support', value: 'Yes' },
        { label: 'Team Management', value: 'Yes' }
      ],
      buttonText: 'Contact Sales',
      buttonLink: '/contact',
      buttonState: null,
      buttonClass: 'plan-button outline',
      isRecommended: false
    }
  ];

  return (
    <div className="pricing-container">
      <div className="container">
        <h1 className="pricing-title">Select the perfect plan for your career needs</h1>
        <p className="pricing-subtitle">
          Transparent pricing. No hidden fees. Cancel anytime.
        </p>

        <div className="pricing-cards">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.isRecommended ? 'recommended' : ''}`}>
              {plan.isRecommended && (
                <div className="recommended-badge">Most Popular</div>
              )}
              
              <div className="card-header">
                <div className={`plan-badge-pill ${plan.badge.toLowerCase()}`}>{plan.badge}</div>
                <h2>{plan.name}</h2>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="amount">{plan.price}</span>
                  {plan.period && <span className="period">{plan.period}</span>}
                </div>
                
                {/* PASS STATE CORRECTLY HERE */}
                <Link 
                  to={plan.buttonLink} 
                  state={plan.buttonState} 
                  className={plan.buttonClass}
                >
                  {plan.buttonText}
                </Link>
              </div>

              <div className="card-features">
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-name">{feature.label}</span>
                      <span className="feature-value">{feature.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-footer-section">
          <div className="top-up-card">
            <div className="top-up-content">
              <h2>Need More Credits?</h2>
              <p>Just need a few more enhancements? Our pay-as-you-go Top-Ups are perfect for when you're not ready for a monthly plan.</p>
            </div>
            <div className="top-up-action">
              <Link to="/top-up" className="cta-button secondary">
                Buy Top-Up Credits
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;