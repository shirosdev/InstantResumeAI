import React from 'react';
import '../styles/Modal.css'; // Reusing your existing modal styles

const ResumePreviewModal = ({ htmlContent, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Resume Preview</h2>
        <div 
          className="resume-preview-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        <div className="modal-actions">
          <button className="submit-button secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;