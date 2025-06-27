import React from 'react';

const About = () => {
  return (
    <div className="page-container">
      <div className="container">
        <h1>About InstantResumeAI</h1>
        <div className="content-section">
          <p className="lead-text">
            InstantResumeAI was founded with a simple mission: to help job seekers stand out in an increasingly competitive and automated job market.
          </p>
          
          <h2>Our Story</h2>
          <p>
            In today's job market, over 85% of resumes are filtered out by Applicant Tracking Systems before they ever reach human eyes. 
            We built InstantResumeAI to level the playing field, giving every job seeker the tools they need to get past these digital gatekeepers.
          </p>
          
          <h2>Our Technology</h2>
          <p>
            Powered by advanced AI and natural language processing, InstantResumeAI analyzes job descriptions and optimizes resumes in real-time. 
            We ensure your resume contains the right keywords, proper formatting, and compelling content that both ATS systems and human recruiters love.
          </p>
          
          <h2>Our Commitment</h2>
          <p>
            We're committed to making professional resume optimization accessible to everyone. During our development phase, all features are 
            completely free. As we grow, we'll continue to offer affordable solutions that deliver real results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;