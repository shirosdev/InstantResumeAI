import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  return (
    <div className="page-container">
      <div className="container">
        <h1>How InstantResumeAI Works</h1>
        <div className="content-section">
          <h2>Our Three-Step Process</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-icon">1</div>
              <h3>Upload Your Resume</h3>
              <p>Upload your current resume in DOC, or DOCX format. Our AI will analyze your existing content to understand your experience and skills.</p>
            </div>
            <div className="process-step">
              <div className="step-icon">2</div>
              <h3>Add Job Description</h3>
              <p>Paste the job description you're targeting. Our AI will identify key requirements and keywords that employers are looking for.</p>
            </div>
            <div className="process-step">
              <div className="step-icon">3</div>
              <h3>Get Enhanced Resume</h3>
              <p>Receive an optimized resume tailored to the specific job. Your resume will be ATS-friendly and highlight relevant experiences.</p>
            </div>
          </div>
        </div>
        
        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <Link to="/signup" className="cta-button primary">Create Your Account</Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;