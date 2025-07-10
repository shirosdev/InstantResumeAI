// frontend/src/components/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="landing-hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="emoji-icon">🧠</span>Welcome to InstantResumeAI
            </h1>
            <p className="hero-tagline">Your Resume. Smarter. Designed for Success.</p>
            
            <div className="hero-description">
              <p>
                In today's fast-moving job market, your resume is your first impression — and often your only one. 
                With recruiters spending as little as 6 to 7 seconds reviewing each resume, and over 85% of applications 
                being filtered out by Applicant Tracking Systems (ATS), standing out isn't optional — it's essential.
              </p>
              <p>
                InstantResumeAI uses the power of artificial intelligence to instantly transform your resume based on 
                the job you're targeting. Whether you're a recent graduate, a tech professional, or someone looking 
                to make a career shift, our tool ensures that your resume isn't just seen — it's noticed.
              </p>
            </div>
            
            <div className="hero-cta">
              <Link to="/signup" className="cta-button primary">
                Start Your Free Trial
              </Link>
              <Link to="/login" className="cta-button secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Role Section */}
      <section className="landing-section ai-section" id="ai-section">
        <div className="container">
          <div className="section-content">
            <h2 className="section-title">
              <span className="emoji-icon">🚀</span>The Role of AI in Modern Hiring
            </h2>
            <p className="section-text">
              Recruitment has evolved. Traditional resumes often fall short when matched against modern hiring algorithms. 
              AI is now not just a trend but a necessity. With InstantResumeAI, we leverage advanced natural language 
              processing (NLP) to match your resume with the exact requirements of the job description you provide. 
              Our system ensures your resume is keyword-rich, ATS-optimized, and perfectly aligned with what employers 
              are actually looking for.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="landing-section what-we-do" id="what-we-do">
        <div className="container">
          <div className="section-content">
            <h2 className="section-title">
              <span className="emoji-icon">💡</span>What We Do
            </h2>
            <p className="section-text">
              Our application is built to do one thing exceptionally well — make your resume smarter. You simply upload 
              your existing resume and the job description for the role you're applying to. Our intelligent engine, 
              then enhances your resume to match that specific opportunity. You receive a polished, 
              professional, and personalized resume — aligned with your career goals.
            </p>
            
            {/* Process Steps */}
            <div className="process-steps">
              <div className="process-step">
                <div className="step-icon">1</div>
                <h3>Upload Your Resume</h3>
                <p>Submit your current resume in any format</p>
              </div>
              <div className="process-step">
                <div className="step-icon">2</div>
                <h3>Add Job Description</h3>
                <p>Paste the job posting you're targeting</p>
              </div>
              <div className="process-step">
                <div className="step-icon">3</div>
                <h3>Enhancement Done</h3>
                <p>Receive your optimized resume in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* What's Next Section */}
      <section className="landing-section whats-next" id="whats-next">
        <div className="container">
          <div className="section-content">
            <h2 className="section-title">
              <span className="emoji-icon">🔮</span>What's Next
            </h2>
            <p className="section-text">
              As we grow, we're moving InstantResumeAI to Microsoft Azure for better scalability, performance, 
              and data security. We're also building features like AI-generated cover letters, resume scoring, 
              LinkedIn profile optimization, and real-time job recommendations — all from within one clean interface. 
              Soon, InstantResumeAI will also be listed on the Azure Marketplace, making it accessible to enterprise 
              clients and HR teams globally.
            </p>
            
            
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="landing-section final-cta" id="final-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              <span className="emoji-icon">🌟</span>Your career journey deserves better tools.
            </h2>
            <p className="cta-subtitle">
              Start today with InstantResumeAI and make your resume work for you.
            </p>
            <Link to="/signup" className="cta-button primary large">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;