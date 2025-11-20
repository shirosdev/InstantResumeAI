import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const HowItWorks = () => {
  // Enhanced schema markup for SEO - invisible to users
  const howItWorksSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Use InstantResumeAI",
    "description": "Learn how to optimize your resume with our AI-powered tool in 3 simple steps",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Upload Your Resume",
        "text": "Upload your current resume in DOC or DOCX format",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Add Job Description",
        "text": "Paste the job description you're targeting",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Get Enhanced Resume",
        "text": "Receive an optimized, ATS-friendly resume tailored to the job",
        "position": 3
      }
    ]
  };

  return (
    <div className="page-container">

      {/* ONLY CHANGE: Enhanced SEO meta tags - invisible to users */}
      <SEO 
        title="How Our AI Job Description Matcher Works"
        description="Learn how InstantResumeAI uses advanced algorithms to match your resume to job descriptions, optimize keywords, and pass ATS filters. Simple 3-step process."
        keywords="how to tailor resume to job description, how ats works, jd resume scanner, resume to job match ai, ai resume builder guide"
        schema={howItWorksSchema}
      />
      
      {/* ALL CONTENT BELOW IS EXACTLY THE SAME AS YOUR ORIGINAL */}
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