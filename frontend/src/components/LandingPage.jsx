// src/components/LandingPage.jsx
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css'; // Main CSS for this component

// --- Icon Placeholders ---
const CheckIcon = () => <span className="icon-placeholder">✓</span>;
const StarIcon = () => <span className="icon-placeholder">★</span>;
const SkillGapIcon = () => <span className="icon-placeholder">🔍</span>;
const SuggestionIcon = () => <span className="icon-placeholder">💡</span>;
const UpdateIcon = () => <span className="icon-placeholder">📝</span>;
const EmailIcon = () => <span className="icon-placeholder">✉️</span>;
const SearchIcon = () => <span className="icon-placeholder">🔎</span>;
// --- End Icon Placeholders ---

// --- Add Card Background Colors Array ---
const cardBackgroundColors = [
    'linear-gradient(to bottom right, #FEF2F2, #FFF1F2)', // Light Red/Pink Tint (Default/Original)
    'linear-gradient(to bottom right, #EFF6FF, #E0F2FE)', // Light Blue Tint
    'linear-gradient(to bottom right, #F0FFF4, #ECFDF5)', // Light Green Tint
    'linear-gradient(to bottom right, #FFFBEB, #FEF9C3)', // Light Yellow Tint
    'linear-gradient(to bottom right, #F5F3FF, #EDE9FE)', // Light Purple Tint
    'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)', // Light Gray Tint
];
// --- End Card Background Colors ---


const LandingPage = () => {
    // --- Add State for Card Background ---
    const [cardBg, setCardBg] = useState(cardBackgroundColors[0]); // Default to the first color
    // --- End State ---

    // --- Effect to Set Random Background on Mount ---
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * cardBackgroundColors.length);
        setCardBg(cardBackgroundColors[randomIndex]);
        console.log("Set card background:", cardBackgroundColors[randomIndex]); // Add console log for debugging
    }, []); // Empty dependency array ensures this runs only once on mount
    // --- End Background Effect ---


    // Scroll reveal effect
    useEffect(() => {
        if (!('IntersectionObserver' in window)) {
            console.log("IntersectionObserver not supported, revealing all elements.");
            document.querySelectorAll('.scroll-reveal').forEach(el => {
                el.classList.add('visible');
            });
            return;
        }

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observerCallback = (entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target); // Unobserve after revealing
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const targets = document.querySelectorAll('.scroll-reveal');
        targets.forEach(el => observer.observe(el));

        return () => {
            targets.forEach(el => {
                if (observer && observer.unobserve) {
                   observer.unobserve(el);
                }
            });
             if (observer && observer.disconnect) {
               observer.disconnect();
            }
        };
    }, []); // Empty dependency array means this effect runs only once when the component mounts


    return (
        <>
            {/* Hero Section */}
            <section className="landing-hero new-hero-styles">
                <div className="container hero-grid-container">
                    {/* Left Side: Text Content */}
                    <div className="hero-content scroll-reveal visible">
                        <h1 className="hero-title">
                            Upgrade your resume
                            <span className="hero-title-gradient"> instantly with AI</span>
                        </h1>
                        <p className="hero-description">
                            Upload your resume and job description — our AI finds missing skills, suggests improvements, and helps you match the job in minutes.
                        </p>
                        <div className="hero-cta">
                            <Link to="/signup" className="cta-button primary">
                                Try for Free
                                <span className="cta-subtext">No credit card required</span>
                            </Link>
                            <Link to="/how-it-works" className="cta-button secondary">
                                See how it works
                            </Link>
                        </div>
                    </div>

                    {/* Right Side: Visual Card Component */}
                    <div className="hero-visual scroll-reveal visible">
                        {/* Apply the random background color using inline style */}
                        <div
                            className="hero-visual-card"
                            style={{ background: cardBg }} // Apply dynamic background here
                        >
                            <div className="hero-visual-header-line"></div>
                            <div className="hero-visual-header">
                                <div className="hero-visual-icon"></div>
                                <div className="hero-visual-header-text">
                                    <div className="placeholder-line short"></div>
                                    <div className="placeholder-line tiny"></div>
                                </div>
                            </div>
                            <div className="hero-visual-body">
                                <div className="placeholder-line long"></div>
                                <div className="placeholder-line medium"></div>
                                <div className="placeholder-line long"></div>
                                <div className="placeholder-line short"></div>
                                <div className="placeholder-line medium"></div>
                                <div className="placeholder-line tiny"></div>
                            </div>
                            <div className="hero-visual-badge top-badge">+5 Skills Found</div>
                            <div className="hero-visual-badge bottom-badge">92% Match</div>
                            <div className="hero-visual-scan-line"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="landing-section how-it-works-section">
                <div className="section-content container">
                    <div className="section-header scroll-reveal">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Get your resume job-ready in three simple steps</p>
                    </div>
                    <div className="process-steps">
                        <div className="process-step scroll-reveal">
                            <div className="step-icon-wrapper step-1"><span className="step-number">1</span></div>
                            <h3>Upload your resume + job description</h3>
                            <p>Simply drag and drop your current resume and paste the job description you're targeting.</p>
                        </div>
                        <div className="process-step scroll-reveal">
                             <div className="step-icon-wrapper step-2"><span className="step-number">2</span></div>
                            <h3>AI analyzes and identifies missing skills</h3>
                            <p>Our advanced AI compares your resume against the job requirements and finds gaps.</p>
                        </div>
                        <div className="process-step scroll-reveal">
                             <div className="step-icon-wrapper step-3"><span className="step-number">3</span></div>
                            <h3>Get instant, editable recommendations</h3>
                            <p>Receive personalized suggestions to align your resume perfectly with the job posting.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section id="features" className="landing-section features-section">
                 <div className="section-content container">
                    <div className="section-header scroll-reveal">
                        <h2 className="section-title">Core Features</h2>
                        <p className="section-subtitle">Powerful AI tools to supercharge your job search</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card scroll-reveal">
                             <div className="feature-icon-wrapper feature-1"><SkillGapIcon /></div>
                            <h3>Skill Gap Detection</h3>
                            <p>Instantly identify which skills and keywords you're missing compared to the job requirements.</p>
                        </div>
                        <div className="feature-card scroll-reveal">
                             <div className="feature-icon-wrapper feature-2"><SuggestionIcon /></div>
                            <h3>AI-Powered Resume Suggestions</h3>
                            <p>Get intelligent recommendations on how to improve your resume content and structure.</p>
                        </div>
                        <div className="feature-card scroll-reveal">
                            <div className="feature-icon-wrapper feature-3"><UpdateIcon /></div>
                            <h3>Instant Resume Updates</h3>
                            <p>Apply AI suggestions with one click and download your optimized resume immediately.</p>
                        </div>
                    </div>
                </div>
            </section>

             {/* AI Highlight Section */}
            <section className="landing-section ai-highlight-section">
                 <div className="section-content container">
                    <div className="ai-highlight-grid">
                        <div className="ai-highlight-text scroll-reveal">
                            <h2 className="section-title">Smart AI that <span className="hero-title-gradient">works for you</span></h2>
                            <p className="section-text">
                                InstantResume.ai uses advanced language models to understand what recruiters want — so you spend less time editing and more time applying.
                            </p>
                            <div className="highlight-list">
                                <div className="highlight-item"><div className="highlight-dot dot-1"></div><span>Analyzes thousands of job postings</span></div>
                                <div className="highlight-item"><div className="highlight-dot dot-2"></div><span>Understands industry-specific keywords</span></div>
                                <div className="highlight-item"><div className="highlight-dot dot-3"></div><span>Learns from successful resume patterns</span></div>
                            </div>
                         </div>
                        <div className="ai-highlight-visual relative scroll-reveal">
                            <div className="ai-visual-card">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                     <div className="ai-visual-item"><div className="ai-icon-bg icon-bg-1 ai-glow"></div><span className="ai-label">Skills Analysis</span></div>
                                     <div className="ai-visual-item"><div className="ai-icon-bg icon-bg-2 ai-glow"></div><span className="ai-label">Content Optimization</span></div>
                                     <div className="ai-visual-item"><div className="ai-icon-bg icon-bg-3 ai-glow"></div><span className="ai-label">Match Scoring</span></div>
                                </div>
                                <div className="ai-processing-box">
                                     <h4>AI Brain Processing</h4>
                                     <div className="ai-dots">
                                         <div className="dot dot-1 ai-glow"></div>
                                         <div className="dot dot-2 ai-glow" style={{animationDelay: '0.2s'}}></div>
                                         <div className="dot dot-3 ai-glow" style={{animationDelay: '0.4s'}}></div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Features Section */}
            <section className="landing-section future-features-section">
                <div className="section-content container">
                    <div className="section-header scroll-reveal">
                        <h2 className="section-title">Coming soon for premium users</h2>
                        <p className="section-subtitle">Exciting features on the horizon</p>
                    </div>
                    <div className="future-features-grid">
                        <div className="feature-card scroll-reveal">
                             <div className="coming-soon-badge">Coming Soon</div>
                            <div className="feature-icon-wrapper feature-1"><EmailIcon /></div>
                            <h3>Resume Blast to Recruiters</h3>
                            <p>Automatically send your optimized resume to relevant recruiters in your industry.</p>
                        </div>
                        <div className="feature-card scroll-reveal">
                             <div className="coming-soon-badge">Coming Soon</div>
                            <div className="feature-icon-wrapper feature-2"><SearchIcon /></div>
                            <h3>Auto Job Matching</h3>
                            <p>Get personalized job recommendations that match your skills and career goals.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section REMOVED */}

            {/* Final CTA Section */}
            <section className="landing-section final-cta new-final-cta-styles">
                <div className="cta-content container scroll-reveal">
                    <h2 className="cta-title">Get started in minutes — it's free</h2>
                    <p className="cta-subtitle">Join thousands of job seekers who've upgraded their resumes with AI</p>
                     <Link to="/signup" className="cta-button primary large">
                        Try InstantResumeAi for Free
                    </Link>
                    <p className="cta-bottom-text">No credit card required • Get results in under 5 minutes</p>
                </div>
            </section>
        </>
    );
};

export default LandingPage;