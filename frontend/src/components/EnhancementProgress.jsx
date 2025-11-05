// src/components/EnhancementProgress.jsx
// RECTIFIED to stop at 90% and show "Finalizing..."

import React from 'react';
import '../styles/EnhancementProgress.css';

// --- RECTIFIED: Update display steps ---
const DISPLAY_STEPS = [
  "Scanning your resume",         // Mapped from backend step 1-2
  "Processing your resume",       // Mapped from backend step 3-4
  "Enhancing your resume",        // Mapped from backend step 5-6
  "Finalizing enhancement..."   // Mapped from backend step 7 (Step 8 is 'complete')
];
// --- END RECTIFICATION ---

const BACKEND_TOTAL_STEPS = 8;
const DISPLAY_TOTAL_STEPS = DISPLAY_STEPS.length; // This is 4

const EnhancementProgress = ({ currentStep }) => { 
  
  // --- RECTIFIED: Cap percentage at 90% ---
  let percentage;
  if (currentStep >= 7) {
    percentage = 90; // Cap at 90% for "Finalizing"
  } else {
    // Calculate percentage based on backend steps
    percentage = Math.max(10, Math.round(((currentStep) / BACKEND_TOTAL_STEPS) * 100));
  }
  // --- END RECTIFICATION ---

  // --- RECTIFIED: Update mapping logic to use 4 steps ---
  let mappedStep;
  if (currentStep <= 2) {
    mappedStep = 1; // "Scanning"
  } else if (currentStep <= 4) {
    mappedStep = 2; // "Processing"
  } else if (currentStep <= 6) {
    mappedStep = 3; // "Enhancing"
  } else {
    mappedStep = 4; // "Finalizing enhancement..." (for step 7)
  }
  // --- END RECTIFICATION ---

  const mappedDescription = DISPLAY_STEPS[mappedStep - 1];

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

      {/* This will now show "Finalizing enhancement..." at the end */}
      <p className="progress-description">
        <span className="spinner-small-inline" /> {/* Always show spinner */}
        {mappedDescription || 'Please wait...'}
      </p>
    </div>
  );
};

export default EnhancementProgress;