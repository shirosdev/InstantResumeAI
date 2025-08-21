// frontend/src/pages/Home.jsx - Enhanced with User Instructions Feature

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LandingPage from '../components/LandingPage';
import resumeService from '../services/resumeService';
import '../styles/LandingPage.css';
import '../styles/ResumeEnhancement.css'; 

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
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [showInstructionPrompt, setShowInstructionPrompt] = useState(false);
  const [wantsToAddInstructions, setWantsToAddInstructions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [enhancementResult, setEnhancementResult] = useState(null);

  useEffect(() => {
    setError('');
  }, [currentStep]);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('lastEnhancementResult');
    if (savedResult) {
      try {
        const parsedResult = JSON.parse(savedResult);
        setEnhancementResult(parsedResult);
        setCurrentStep(4); // Updated to step 4 for download
      } catch (e) {
        console.error("Failed to parse saved enhancement result", e);
        sessionStorage.removeItem('lastEnhancementResult');
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
      // User chose not to add instructions, proceed to enhancement
      handleEnhance();
    }
  };

  const handleEnhance = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await resumeService.enhanceResume(
        resumeFile, 
        jobDescription,
        userInstructions // Pass the user instructions (empty string if user chose not to add)
      );
      if (response.data) {
        setEnhancementResult(response.data);
        sessionStorage.setItem('lastEnhancementResult', JSON.stringify(response.data));
        setCurrentStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enhance resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!enhancementResult?.enhanced_resume_id) {
      setError('No enhanced resume ID available');
      return;
    }
    
    try {
      setError(''); // Clear any existing errors
      console.log('Attempting to download resume with ID:', enhancementResult.enhanced_resume_id);
      
      const result = await resumeService.downloadResume(enhancementResult.enhanced_resume_id);
      
      // If we reach here, download was successful
      console.log('Download initiated successfully');
      
    } catch (err) {
      console.error('Download failed:', err);
      
      // Provide specific error messages based on the error
      if (err.message) {
        setError(`Download failed: ${err.message}`);
      } else if (err.response?.data?.message) {
        setError(`Download failed: ${err.response.data.message}`);
      } else {
        setError('Failed to download resume. Please try again.');
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setResumeFile(null);
    setJobDescription('');
    setUserInstructions('');
    setWantsToAddInstructions(null);
    setShowInstructionPrompt(false);
    setEnhancementResult(null);
    setError('');
    sessionStorage.removeItem('lastEnhancementResult');
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="workbench-header">
          <h1>Resume Enhancement Workbench</h1>
          <p className="page-subtitle">A guided experience to perfectly tailor your resume.</p>
        </div>

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
                <InstructionPromptModal
                  onChoice={handleInstructionChoice}
                />
              )}
              {wantsToAddInstructions && !showInstructionPrompt && (
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
            <ResultsStep
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Modal component for instruction prompt
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

// New component for user instructions input
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
            {exampleInstructions.map((example, index) => (
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

// Updated Job Description Step component
const JobDescriptionStep = ({ resumeFile, jobDescription, setJobDescription, onNext, onBack }) => {
  return (
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
        <button className="submit-button" onClick={onNext} disabled={jobDescription.length < 50}>
          Next
        </button>
      </div>
    </div>
  );
};

// Sub-components (Resume Upload and Results remain the same)
const ResumeUploadStep = ({ onUpload }) => {
  const [error, setError] = useState('');
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      if (!file.name.toLowerCase().endsWith('.docx')) {
        setError('Please upload a DOCX file.');
        return;
      }
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Click to browse or drag & drop</span>
        <span className="file-format-info">DOCX files only, max 10MB</span>
      </label>
      <input type="file" id="resume-upload" accept=".docx" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
};

const ResultsStep = ({ onDownload, onReset }) => {
    return (
      <div className="workbench-panel results-panel">
        <div className="results-icon">✓</div>
        <h3>Enhancement Complete!</h3>
        <p>Your AI-powered resume is ready for download.</p>
        <p>Kindly note that the downloaded resume will include a detailed summary of all enhancements at the end</p>
        <div className="panel-actions simplified">
          <button className="submit-button secondary" onClick={onReset}>Enhance Another</button>
          <button className="submit-button" onClick={onDownload}>Download Your Resume</button>
        </div>
      </div>
    );
};

export default Home;