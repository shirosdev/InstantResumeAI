// frontend/src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LandingPage from '../components/LandingPage';
import resumeService from '../services/resumeService';
import '../styles/LandingPage.css';
import '../styles/ResumeEnhancement.css';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  if (user) {
    return <EnhancementWorkbench />;
  }
  return <LandingPage />;
};

const Stepper = ({ currentStep }) => {
  const steps = ["Upload Resume", "Add Job Description", "Customize Instructions", "Download Enhanced Resume"];
  return (
    <div className="stepper-container">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`step-item ${currentStep >= index + 1 ? 'active' : ''}`}>
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </div>
          {index < steps.length - 1 && <div className="step-connector"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const EnhancementWorkbench = () => {
  const { userStatus, loading: authLoading, fetchUserStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [showInstructionPrompt, setShowInstructionPrompt] = useState(false);
  const [wantsToAddInstructions, setWantsToAddInstructions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [enhancementResult, setEnhancementResult] = useState(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasAgreedToDisclaimer, setHasAgreedToDisclaimer] = useState(false);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  useEffect(() => {
    setError('');
  }, [currentStep]);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('lastEnhancementResult');
    if (savedResult) {
      try {
        const parsedResult = JSON.parse(savedResult);
        setEnhancementResult(parsedResult);
        setCurrentStep(4);
        const agreed = sessionStorage.getItem('disclaimerAgreed');
        if (agreed === parsedResult.enhanced_resume_id) {
          setHasAgreedToDisclaimer(true);
        } else {
          setShowDisclaimer(true);
        }
      } catch (e) {
        console.error("Failed to parse saved enhancement result", e);
        sessionStorage.removeItem('lastEnhancementResult');
        sessionStorage.removeItem('disclaimerAgreed');
      }
    }
  }, []);

  const handleResumeUpload = (file) => {
    setResumeFile(file);
    setCurrentStep(2);
  };

  const handleJobDescriptionNext = () => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      setError('Please provide a job description (at least 50 characters)');
      return;
    }
    setError('');
    setCurrentStep(3);
    setShowInstructionPrompt(true);
  };

  const handleInstructionChoice = (choice) => {
    setWantsToAddInstructions(choice);
    setShowInstructionPrompt(false);
    if (!choice) {
      setIsAutoProcessing(true);
      handleEnhance();
    }
  };

  const handleEnhance = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await resumeService.enhanceResume(resumeFile, jobDescription, userInstructions);
      if (response.data) {
        setEnhancementResult(response.data);
        sessionStorage.setItem('lastEnhancementResult', JSON.stringify(response.data));
        setCurrentStep(4);
        setShowDisclaimer(true);
        fetchUserStatus(); // Refresh user status to show decreased credits
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to enhance resume.';
      // Check for the specific limit reached flag from the backend
      if (err.response?.data?.limit_reached) {
          setError(errorMessage); // This will trigger the top-up display
      } else {
          setError(errorMessage);
      }
      setIsAutoProcessing(false);
    } finally {
      setIsProcessing(false);
      setIsAutoProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!enhancementResult?.enhanced_resume_id) {
      setError('No enhanced resume ID available');
      return;
    }
    
    try {
      setError('');
      await resumeService.downloadResume(enhancementResult.enhanced_resume_id);
    } catch (err) {
      setError(err.message || 'Failed to download resume. Please try again.');
    }
  };
  
  const handleDisclaimerAgreement = async () => {
    try {
      await resumeService.logDisclaimerAgreement(enhancementResult.enhanced_resume_id);
      setHasAgreedToDisclaimer(true);
      setShowDisclaimer(false);
      sessionStorage.setItem('disclaimerAgreed', enhancementResult.enhanced_resume_id);
    } catch (err) {
      setError("Could not save your agreement. Please try again.");
    }
  };

  const handleReset = () => {
    fetchUserStatus();
    setCurrentStep(1);
    setResumeFile(null);
    setJobDescription('');
    setUserInstructions('');
    setWantsToAddInstructions(null);
    setShowInstructionPrompt(false);
    setEnhancementResult(null);
    setError('');
    sessionStorage.removeItem('lastEnhancementResult');
    sessionStorage.removeItem('disclaimerAgreed');
    setHasAgreedToDisclaimer(false);
    setShowDisclaimer(false);
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading"><div className="spinner"></div><p>Loading Workbench...</p></div>
        </div>
      </div>
    );
  }

  // Determine if the user has hit their limit
  const hasHitLimit = userStatus && userStatus.resume_limit !== null && userStatus.remaining_enhancements <= 0;

  return (
    <div className="page-container">
      <div className="container">
        <div className="workbench-header">
          <h1>Resume Enhancement Workbench</h1>
          <p className="page-subtitle">A guided experience to perfectly tailor your resume.</p>
        </div>
        
        {/* If the user has hit their limit OR the API returned a limit error, show the top-up panel */}
        {hasHitLimit || error.includes('Please top-up to continue') ? (
          <div className="workbench-content">
            <div className="workbench-panel">
              <h3>Enhancement Limit Reached</h3>
              <p>You have used all available enhancements for your plan. Purchase more credits to continue optimizing your resume.</p>
              <div className="panel-actions simplified">
                <Link to="/top-up" className="submit-button">
                  Purchase More Credits
                </Link>
                <Link to="/pricing" className="submit-button secondary">
                  View Subscription Plans
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Stepper currentStep={currentStep} />
            {error && <div className="error-message main-error">{error}</div>}
            <div className="workbench-content">
              {currentStep === 1 && <ResumeUploadStep onUpload={handleResumeUpload} />}
              {currentStep === 2 && (
                <JobDescriptionStep
                  resumeFile={resumeFile}
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                  onNext={handleJobDescriptionNext}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <>
                  {showInstructionPrompt && (
                    <InstructionPromptModal onChoice={handleInstructionChoice} />
                  )}
                  {isAutoProcessing && <AutoProcessingStep />}
                  {wantsToAddInstructions && !showInstructionPrompt && !isAutoProcessing && (
                    <UserInstructionsStep
                      userInstructions={userInstructions}
                      setUserInstructions={setUserInstructions}
                      onEnhance={handleEnhance}
                      isProcessing={isProcessing}
                      onBack={() => {
                        setCurrentStep(2);
                        setWantsToAddInstructions(null);
                      }}
                    />
                  )}
                </>
              )}
              {currentStep === 4 && (
                <>
                  {showDisclaimer && (
                    <DisclaimerModal 
                      onAgree={handleDisclaimerAgreement}
                      onClose={() => setShowDisclaimer(false)}
                    />
                  )}
                  <ResultsStep
                    onDownload={handleDownload}
                    onReset={handleReset}
                    isDownloadDisabled={!hasAgreedToDisclaimer}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DisclaimerModal = ({ onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-content disclaimer-modal-content">
        <h3 className="disclaimer-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="30"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Important Notice Before You Proceed
        </h3>
        <div className="disclaimer-text">
          I understand and agree that the resume generated/enhanced by InstantResumeAI is AI-assisted content. I am solely responsible for reviewing, verifying, and using the final document, and InstantResumeAI is not liable for any inaccuracies, misrepresentations, and/or outcomes resulting from its use.
        </div>
        <div className="disclaimer-agreement">
          <input 
            type="checkbox" 
            id="disclaimer-checkbox" 
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
          />
          <label htmlFor="disclaimer-checkbox">
            I understand and agree to the terms above.
          </label>
        </div>
        <p className="disclaimer-note">
          InstantResumeAI provides AI-powered assistance to help you create and refine your resume. We do not guarantee job offers, interview calls, or compliance with every employer’s specific requirements. Please ensure accuracy and truthfulness before using your resume for professional purposes.
        </p>
        <div className="modal-actions">
          <button 
            className="submit-button" 
            onClick={onAgree}
            disabled={!isChecked}
          >
            Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const InstructionPromptModal = ({ onChoice }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content instruction-prompt">
        <div className="modal-icon">
          <svg className="customize-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h3>Customize Your Enhancement</h3>
        <p>Would you like to add specific instructions for how your resume should be enhanced?</p>
        <p className="modal-subtitle">
          This allows you to emphasize certain skills, adjust tone, or focus on specific experiences.
        </p>
        <div className="modal-actions">
          <button 
            className="submit-button secondary" 
            onClick={() => onChoice(false)}
          >
            No, Use Standard Enhancement
          </button>
          <button 
            className="submit-button" 
            onClick={() => onChoice(true)}
          >
            Yes, Add Instructions
          </button>
        </div>
      </div>
    </div>
  );
};

const UserInstructionsStep = ({ userInstructions, setUserInstructions, onEnhance, isProcessing, onBack }) => {
  const [showExamples, setShowExamples] = useState(false);
  const exampleInstructions = [
    "Emphasize leadership and team management experience over technical implementation details",
    "Minimize references to technologies older than 5 years, focus on modern tech stack",
    "Highlight international experience and cross-cultural collaboration",
    "Downplay senior-level titles to avoid appearing overqualified",
    "Focus heavily on quantifiable achievements and ROI metrics",
    "Address the 2-year gap by emphasizing continuous learning and certifications"
  ];

  return (
    <div className="workbench-panel">
      <h3>Step 3: Add Your Custom Instructions</h3>
      <p>Provide specific guidance on how you want your resume enhanced.</p>
      <div className="instruction-info-box">
        <div className="info-icon">💡</div>
        <div className="info-content">
          <strong>Your instructions have top priority</strong>
          <p>The AI will prioritize your specific requirements above standard optimization practices.</p>
        </div>
      </div>
      <div className="examples-section">
        <button 
          className="examples-toggle"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? 'Hide' : 'Show'} Example Instructions
          <span className={`arrow ${showExamples ? 'up' : 'down'}`}>▼</span>
        </button>
        {showExamples && (
          <div className="examples-list">
            {exampleInstructions.map((index, example) => (
              <div 
                key={index} 
                className="example-item"
                onClick={() => setUserInstructions(example)}
              >
                <span className="example-icon">→</span>
                {example}
              </div>
            ))}
          </div>
        )}
      </div>
      <textarea
        className="instructions-textarea"
        value={userInstructions}
        onChange={(e) => setUserInstructions(e.target.value)}
        placeholder="Example: 'Focus on cloud architecture experience and AWS certifications. Minimize mentions of junior roles. Emphasize team leadership in all project descriptions.'"
        rows="8"
        disabled={isProcessing}
      />
      <div className="character-count">
        {userInstructions.length} / 1000 characters
        {userInstructions.length > 800 && (
          <span className="warning"> (approaching limit)</span>
        )}
      </div>
      <div className="panel-actions">
        <button className="submit-button secondary" onClick={onBack} disabled={isProcessing}>
          Back
        </button>
        <button 
          className="submit-button" 
          onClick={onEnhance} 
          disabled={isProcessing || userInstructions.length === 0}
        >
          {isProcessing ? <><span className="spinner"></span>Enhancing...</> : 'Enhance Resume'}
        </button>
      </div>
    </div>
  );
};

const AutoProcessingStep = () => (
  <div className="workbench-panel">
    <h3>Step 3: Standard Enhancement in Progress</h3>
    <p>You've selected the standard enhancement. The AI is now processing your resume.</p>
    <div className="processing-placeholder">
      <div className="spinner-large"></div>
      <p>Please wait, this may take a moment...</p>
    </div>
    <textarea className="instructions-textarea" placeholder="Processing, please wait..." rows="8" disabled={true} />
    <div className="character-count">...</div>
    <div className="panel-actions">
      <button className="submit-button secondary" disabled={true}>Back</button>
      <button className="submit-button" disabled={true}><span className="spinner"></span>Enhancing...</button>
    </div>
  </div>
);

const JobDescriptionStep = ({ resumeFile, jobDescription, setJobDescription, onNext, onBack }) => (
  <div className="workbench-panel">
    <h3>Step 2: Add the Job Description</h3>
    <p>Paste the description for your target role below.</p>
    <div className="resume-preview-card">
      <strong>Selected Resume:</strong> {resumeFile.name}
    </div>
    <textarea
      className="jd-textarea"
      value={jobDescription}
      onChange={(e) => setJobDescription(e.target.value)}
      placeholder="Paste the job description here..."
      rows="12"
    />
    <div className="panel-actions">
      <button className="submit-button secondary" onClick={onBack}>Back</button>
      <button className="submit-button" onClick={onNext} disabled={jobDescription.length < 50}>Next</button>
    </div>
  </div>
);

const ResumeUploadStep = ({ onUpload }) => {
  const [error, setError] = useState('');
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB'); return; }
      if (!file.name.toLowerCase().endsWith('.docx')) { setError('Please upload a DOCX file.'); return; }
      setError('');
      onUpload(file);
    }
  };

  return (
    <div className="workbench-panel">
      <h3>Step 1: Upload Your Resume</h3>
      <p>Begin by uploading your resume in .docx format.</p>
      {error && <div className="error-message">{error}</div>}
      <label htmlFor="resume-upload" className="file-drop-zone">
        <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Click to browse or drag & drop</span>
        <span className="file-format-info">DOCX files only, max 10MB</span>
      </label>
      <input type="file" id="resume-upload" accept=".docx" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
};

const ResultsStep = ({ onDownload, onReset, isDownloadDisabled }) => (
  <div className="workbench-panel results-panel">
    <div className="results-icon">✓</div>
    <h3>Enhancement Complete!</h3>
    <p>Your AI-powered resume is ready for download.</p>
    <p>Kindly note that the downloaded resume will include a detailed summary of all enhancements at the end</p>
    <div className="panel-actions simplified">
      <button className="submit-button secondary" onClick={onReset}>Enhance Another</button>
      <button className="submit-button" onClick={onDownload} disabled={isDownloadDisabled}>
        {isDownloadDisabled ? 'Agree to Terms to Download' : 'Download Your Resume'}
      </button>
    </div>
  </div>
);

export default Home;