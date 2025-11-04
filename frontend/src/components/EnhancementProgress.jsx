// src/components/EnhancementProgress.jsx

import React from 'react';
import '../styles/EnhancementProgress.css';

// CHANGED: Define the 4 new steps you want to display
const DISPLAY_STEPS = [
  "Scanning your resume",
  "Processing your resume",
  "Enhancing your resume",
  "Enhancement complete"
];

// CHANGED: We still need to know the total number of *backend* steps
const BACKEND_TOTAL_STEPS = 8;
const DISPLAY_TOTAL_STEPS = DISPLAY_STEPS.length;

const EnhancementProgress = ({ currentStep, description }) => { // The 'description' prop is no longer used but kept for compatibility
  
  // CHANGED: Calculate percentage based on the *backend* steps (1-8)
  // This keeps the progress bar smooth, e.g., 12.5%, 25%, etc.
  const percentage = Math.round(((currentStep - 1) / BACKEND_TOTAL_STEPS) * 100);

  // CHANGED: Logic to map the 8 backend steps to your 4 display steps
  let mappedStep;
  if (currentStep <= 2) {
    mappedStep = 1; // Backend steps 1-2 map to "Scanning"
  } else if (currentStep <= 4) {
    mappedStep = 2; // Backend steps 3-4 map to "Processing"
  } else if (currentStep <= 6) {
    mappedStep = 3; // Backend steps 5-6 map to "Enhancing"
  } else {
    mappedStep = 4; // Backend steps 7-8 map to "Complete"
  }

  // CHANGED: Get the description text from our new array
  const mappedDescription = DISPLAY_STEPS[mappedStep - 1];

  return (
    <div className="progress-container">
      <h3 className="progress-title">Enhancement in Progress...</h3>
      
      {/* Progress Bar (no change needed here) */}
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
        <span className="progress-bar-text">{percentage}%</span>
      </div>

      {/* Current Step Description (CHANGED) */}
      <p className="progress-description">
        {mappedDescription || 'Please wait...'}
      </p>

      {/* Step List (CHANGED) */}
      <ul className="progress-step-list">
        {DISPLAY_STEPS.map((step, index) => { // Loop over new steps
          const stepNumber = index + 1;
          let statusClass = 'pending';
          
          // Use mappedStep to determine status
          if (stepNumber < mappedStep) {
            statusClass = 'completed';
          } else if (stepNumber === mappedStep) {
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