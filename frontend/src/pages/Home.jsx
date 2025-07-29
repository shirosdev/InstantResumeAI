// frontend/src/pages/Home.jsx (Final Version - Inline Styles Removed)

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
  const steps = ["Upload Resume", "Add Job Description", "Download Enhanced Resume"];
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
        setCurrentStep(3); // Go directly to the download step
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

  const handleEnhance = async () => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      setError('Please provide a job description (at least 50 characters)');
      return;
    }
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await resumeService.enhanceResume(resumeFile, jobDescription);
      if (response.data) {
        setEnhancementResult(response.data);
        sessionStorage.setItem('lastEnhancementResult', JSON.stringify(response.data));
        setCurrentStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enhance resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  
  const handleDownload = async () => {
    if (!enhancementResult?.enhanced_resume_id) return;
    try {
      await resumeService.downloadResume(enhancementResult.enhanced_resume_id);
    } catch (err) {
      setError('Failed to download resume.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setResumeFile(null);
    setJobDescription('');
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
              onEnhance={handleEnhance}
              isProcessing={isProcessing}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
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

// --- Sub-components ---

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
        <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <span>Click to browse or drag & drop</span>
        <span className="file-format-info">DOCX files only, max 10MB</span>
      </label>
      <input type="file" id="resume-upload" accept=".docx" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
};

const JobDescriptionStep = ({ resumeFile, jobDescription, setJobDescription, onEnhance, isProcessing, onBack }) => {
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
        disabled={isProcessing}
      />
      <div className="panel-actions">
        <button className="submit-button secondary" onClick={onBack} disabled={isProcessing}>Back</button>
        <button className="submit-button" onClick={onEnhance} disabled={isProcessing || jobDescription.length < 50}>
          {isProcessing ? <><span className="spinner"></span>Processing...</> : 'Enhance Resume'}
        </button>
      </div>
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