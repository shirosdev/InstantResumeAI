// frontend/src/pages/Investors.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Investors.css';

const Investors = () => {
  // Array for the "Why We Stand Out" features for easier management
  const standoutFeatures = [
    {
      title: 'Proprietary AI Enhancement',
      description: 'Real-world impact on resume quality and effectiveness.'
    },
    {
      title: 'ATS-Tested Scoring',
      description: 'Our resume scoring system is tested against popular Applicant Tracking Systems.'
    },
    {
      title: 'Scalable Credit Model',
      description: 'Designed to maximize retention and create upsell opportunities.'
    },
    {
      title: 'B2C & B2B Growth',
      description: 'Strong consumer foundation with expanding opportunities in the business sector.'
    }
  ];

  return (
    <div className="investors-page-wrapper">
      <div className="investors-hero">
        <div className="container">
          <h1>The Smartest Way to Get Interviews</h1>
          <p className="hero-subtext">
            At InstantResumeAI, we’re transforming how candidates get hired. Our AI-powered platform is built to help job seekers move faster and apply smarter—addressing key inefficiencies in the traditional job search process.
          </p>
        </div>
      </div>

      <div className="page-content container">
        <section className="investors-section">
          <h2>Momentum You Can’t Ignore</h2>
          <p>
            We're not just building a product—we're capturing a movement. With a rapidly growing user base, significant waitlist traction, and multiple enterprise discussions underway, our momentum speaks for itself.
          </p>
          <p>
            The job search process is broken. We’re here to fix it—with results that challenge outdated norms and deliver real impact.
          </p>
        </section>

        <section className="investors-section standout-section">
          <h2>Why We Stand Out</h2>
          <div className="numbered-feature-list">
            {standoutFeatures.map((feature, index) => (
              <div key={index} className="numbered-feature-item">
                <span className="feature-number">{`0${index + 1}`}</span>
                <div className="feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="investors-section">
          <h2>What’s Next?</h2>
          <p>
            Our public launch is on the horizon. The upcoming roadmap includes powerful tools: an AI Cover Letter Generator, LinkedIn Optimizer, and a smart Interview Coach—all seamlessly integrated into a single platform.
          </p>
        </section>

        <section className="investors-section contact-section">
          <h2>Want to Learn More?</h2>
          <p>
            We’re opening conversations with a select group of investors. To request our detailed investor document—covering financials, growth, and projections—contact us.
          </p>
          <div className="contact-investors">
            <a href="mailto:invest@instantresumeai.com" className="investor-email-link">
              📬 invest@instantresumeai.com
            </a>
            <p>
              Join our investor list to receive early access to our demo, investor deck, and updates on enterprise pilots.
            </p>
          </div>
          <p className="invest-cta">
            Let us show you why this is the right time to invest in the future of career technology.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Investors;