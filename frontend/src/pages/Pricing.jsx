// frontend/src/pages/Pricing.jsx
// --- FULLY UPDATED FILE ---

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Pricing.css'; // We will add styles to this

// Data based on the provided image
const pricingPlans = [
  {
    name: 'Freemium',
    planType: 'Free',
    description: 'Perfect for getting started and trying out the basics.',
    price: '$0',
    period: '',
    maxCap: '10/month',
    buttonText: 'Get Started Free',
    buttonLink: '/signup',
    isFeatured: false,
    isDisabled: false,
    features: [
      { name: 'Max Enhancements', value: '10 / month' },
      { name: 'Resume Preview', value: 'No' },
      { name: 'Resume Download', value: 'Yes' },
    ]
  },
  {
    name: 'Starter',
    planType: 'Paid',
    description: 'For job seekers applying to multiple roles.',
    price: '$12',
    period: '/month',
    maxCap: '30/month',
    buttonText: 'Coming Soon',
    buttonLink: '#',
    isFeatured: true,
    isDisabled: true, // We'll disable this until the backend is ready
    features: [
      { name: 'Max Enhancements', value: '30 / month' },
      { name: 'Enable Preview', value: 'Yes' },
      { name: 'Resume Download', value: 'Yes' },
      { name: 'Limited ATS', value: 'Yes' },
    ]
  },
  {
    name: 'Pro',
    planType: 'Paid',
    description: 'For power users and professionals.',
    price: '$24',
    period: '/month',
    maxCap: '100/month',
    buttonText: 'Coming Soon',
    buttonLink: '#',
    isFeatured: false,
    isDisabled: true, // We'll disable this until the backend is ready
    features: [
      { name: 'Max Enhancements', value: '100 / month' },
      { name: 'Enable Preview', value: 'Yes' },
      { name: 'Full ATS', value: 'Yes' },
      { name: 'Resume Match', value: 'Yes' },
    ]
  },
  {
    name: 'Enterprise',
    planType: 'Paid',
    description: 'Custom solutions for teams and businesses.',
    price: 'Contact Us',
    period: '',
    maxCap: '300+/month',
    buttonText: 'Contact Sales',
    buttonLink: '/contact',
    isFeatured: false,
    isDisabled: false,
    features: [
      { name: 'Max Enhancements', value: 'Custom' },
      { name: 'Calculation Based', value: 'Yes' },
      { name: 'Dedicated Support', value: 'Yes' },
      { name: 'Team Management', value: 'Yes' },
    ]
  }
];

const Pricing = () => {
  const { user, userStatus } = useAuth();

  // Function to determine button text/state
  const getButton = (plan) => {
    // If the plan is disabled, show "Coming Soon"
    if (plan.isDisabled) {
      return (
        <button className="plan-button disabled" disabled>
          {plan.buttonText}
        </button>
      );
    }

    // If it's the Enterprise plan, link to contact
    if (plan.name === 'Enterprise') {
      return (
        <Link to={plan.buttonLink} className="plan-button secondary">
          {plan.buttonText}
        </Link>
      );
    }
    
    // Check if user is logged in
    if (user) {
      // Check if this is their current plan
      // We assume "Free - 3 Enhancements" is the name for the "Freemium" plan in the DB
      const isCurrentPlan = userStatus?.plan_name?.includes('Free') && plan.name === 'Freemium';
      
      if (isCurrentPlan) {
        return (
          <button className="plan-button active" disabled>
            Current Plan
          </button>
        );
      }
      
      // If logged in but not this plan, show original button (e.g., Get Started)
      // This will be updated when subscription logic is built
      return (
        <Link to={plan.buttonLink} className="plan-button">
          {plan.buttonText}
        </Link>
      );

    } else {
      // If not logged in, show the default button
      return (
        <Link to={plan.buttonLink} className="plan-button">
          {plan.buttonText}
        </Link>
      );
    }
  };

  return (
    <div className="pricing-container">
      <div className="container">
        <h1 className="pricing-title">Choose Your Plan</h1>
        <p className="pricing-subtitle">
          Select the perfect plan for your career needs.
        </p>

        <div className="pricing-cards-4"> {/* Use new 4-column grid */}
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name} 
              className={`pricing-card ${plan.isFeatured ? 'featured' : ''}`}
            >
              {plan.isDisabled && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
              <div className="card-header">
                <div className="plan-badge">{plan.planType}</div>
                <h2>{plan.name}</h2>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="amount">{plan.price}</span>
                  {plan.period && <span className="period">{plan.period}</span>}
                </div>
                {getButton(plan)}
              </div>
              <div className="card-features">
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature.name}>
                      <span className="feature-name">{feature.name}</span>
                      <span className="feature-value">{feature.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* --- NEW SECTION for Top-Up --- */}
        <div className="top-up-cta">
          <div className="top-up-content">
            <h3>Need More Credits?</h3>
            <p>
              Just need a few more enhancements? Our pay-as-you-go Top-Ups are perfect for when you're not ready for a monthly plan.
            </p>
          </div>
          <div className="top-up-action">
            <Link to="/top-up" className="plan-button secondary">
              Buy Top-Up Credits
            </Link>
          </div>
        </div>
        {/* --- END NEW SECTION --- */}

      </div>
    </div>
  );
};

export default Pricing;