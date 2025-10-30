// src/components/EnhancementProgress.jsx

import React from 'react';
import '../styles/EnhancementProgress.css'; // We will create this CSS file next

// These steps match the ones we defined for the backend
const PROGRESS_STEPS = [
  "Analyzing resume structure and sections",
  "Identifying key information to preserve",
  "Generating new content based on instructions (if any)",
  "Preparing content chunks for AI enhancement",
  "Enhancing resume content with AI (processing chunks)",
  "Applying enhancements while preserving formatting",
  "Integrating newly generated content",
  "Finalizing document and saving"
];
const TOTAL_STEPS = PROGRESS_STEPS.length;

const EnhancementProgress = ({ currentStep, description }) => {
  const percentage = Math.round(((currentStep - 1) / TOTAL_STEPS) * 100);

  return (
    <div className="progress-container">
      <h3 className="progress-title">Enhancement in Progress...</h3>
      
      {/* Progress Bar */}
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
        <span className="progress-bar-text">{percentage}%</span>
      </div>

      {/* Current Step Description */}
      <p className="progress-description">
        {description || 'Please wait...'}
      </p>

      {/* Step List */}
      <ul className="progress-step-list">
        {PROGRESS_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          let statusClass = 'pending';
          if (stepNumber < currentStep) {
            statusClass = 'completed';
          } else if (stepNumber === currentStep) {
            statusClass = 'active';
          }

          return (
            <li key={stepNumber} className={`progress-step-item ${statusClass}`}>
              <div className="step-icon">
                {statusClass === 'completed' ? '✓' : (statusClass === 'active' ? <div className="spinner-small" /> : '○')}
              </div>
              <span className="step-text">{step}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EnhancementProgress;