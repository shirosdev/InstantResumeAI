// frontend/src/pages/Pricing.jsx
// --- FULLY UPDATED FILE ---

import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../hooks/useAuth';
import '../styles/Pricing.css'; // We will add styles to this

// --- THIS IS THE FIX ---
// Prices are now numbers (e.g., 12) instead of strings (e.g., "$12")
const pricingPlans = [
  {
    id: 1, // Assuming 'Freemium' is plan_id 1
    name: 'Freemium',
    planType: 'Free',
    description: 'Perfect for getting started and trying out the basics.',
    price: 0, // Use number 0
    period: '',
    maxCap: '10/month',
    buttonText: 'Get Started Free',
    buttonLink: '/signup', // Link for non-logged-in users
    isFeatured: false,
    isDisabled: false, // Freemium is always enabled
    features: [
      { name: 'Max Enhancements', value: '10 / month' },
      { name: 'Resume Preview', value: 'No' },
      { name: 'Resume Download', value: 'Yes' },
    ]
  },
  {
    id: 2, // Assuming 'Starter' is plan_id 2
    name: 'Starter',
    planType: 'Paid',
    description: 'For job seekers applying to multiple roles.',
    price: 12.00, // Use number 12.00
    period: '/month',
    maxCap: '30/month',
    buttonText: 'Choose Starter', // Updated button text
    buttonLink: '/checkout', // Link for navigation
    isFeatured: true,
    isDisabled: false,
    features: [
      { name: 'Max Enhancements', value: '30 / month' },
      { name: 'Enable Preview', value: 'Yes' },
      { name: 'Resume Download', value: 'Yes' },
      { name: 'Limited ATS', value: 'Yes' },
    ]
  },
  {
    id: 3, // Assuming 'Pro' is plan_id 3
    name: 'Pro',
    planType: 'Paid',
    description: 'For power users and professionals.',
    price: 24.00, // Use number 24.00
    period: '/month',
    maxCap: '100/month',
    buttonText: 'Choose Pro', // Updated button text
    buttonLink: '/checkout', // Link for navigation
    isFeatured: false,
    isDisabled: false,
    features: [
      { name: 'Max Enhancements', value: '100 / month' },
      { name: 'Enable Preview', value: 'Yes' },
      { name: 'Full ATS', value: 'Yes' },
      { name: 'Resume Match', value: 'Yes' },
    ]
  },
  {
    id: 4, // Assuming 'Enterprise' is plan_id 4
    name: 'Enterprise',
    planType: 'Paid',
    description: 'Custom solutions for teams and businesses.',
    price: 0, // Use number 0
    period: '',
    maxCap: '300+/month',
    buttonText: 'Contact Sales',
    buttonLink: '/contact', // Always links to contact
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
// --- END OF FIX ---

const Pricing = () => {
  const { user, userStatus } = useAuth();
  const navigate = useNavigate(); // Get navigate hook

  // --- NEW: Handler to navigate to checkout with plan info ---
  const handleSelectPlan = (plan) => {
    // For paid plans, go to checkout
    if (plan.price > 0) {
      navigate('/checkout', { 
        state: { 
          purchaseType: 'subscription', 
          item: plan // Pass the whole plan object
        } 
      });
    } else if (plan.name === 'Enterprise') {
      // For Enterprise, go to contact
      navigate('/contact');
    }
    // For Freemium, do nothing or link to signup if not logged in
  };

  // Function to determine button text/state
  const getButton = (plan) => {
    // If the plan is disabled (e.g., old "Coming Soon" logic)
    if (plan.isDisabled) {
      return (
        <button className="plan-button disabled" disabled>
          Coming Soon
        </button>
      );
    }

    // Enterprise plan always links to /contact
    if (plan.name === 'Enterprise') {
      return (
        <Link to={plan.buttonLink} className="plan-button secondary">
          {plan.buttonText}
        </Link>
      );
    }
    
    // Check if user is logged in
    if (user && userStatus) {
      // Check if this is their current plan using plan_id
      const isCurrentPlan = userStatus.plan_id === plan.id;
      
      if (isCurrentPlan) {
        return (
          <button className="plan-button active" disabled>
            Current Plan
          </button>
        );
      }
      
      // If logged in, not current plan, and not enterprise: show purchase button
      return (
        <button 
          className="plan-button"
          onClick={() => handleSelectPlan(plan)} // Navigate to checkout
        >
          {plan.buttonText}
        </button>
      );

    } else {
      // If not logged in, show the default button (e.g., Get Started Free -> /signup)
      return (
        <Link 
          to={plan.name === 'Freemium' ? '/signup' : '/login'} // Send to login for paid plans
          className="plan-button"
        >
          {plan.name === 'Freemium' ? 'Get Started Free' : 'Sign In to Buy'}
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

        <div className="pricing-cards-4">
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
                  {/* Handle $0 vs priced plans */}
                  {plan.price > 0 ? (
                    <>
                      <span className="amount">${plan.price}</span>
                      {plan.period && <span className="period">{plan.period}</span>}
                    </>
                  ) : (
                    <span className="amount">{plan.name === 'Enterprise' ? 'Contact Us' : '$0'}</span>
                  )}
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

        <div className="top-up-cta">
          <div className="top-up-content">
            <h3>Need More Credits?</h3>
            <p>
              Just need a few more enhancements? Our pay-as-you-go Top-Ups are perfect for when you're not ready for a monthly plan.
            </p>
          </div>
          <div className="top-up-action">
            {/* --- UPDATED LINK TO /top-up --- */}
            <Link to="/top-up" className="plan-button secondary">
              Buy Top-Up Credits
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;