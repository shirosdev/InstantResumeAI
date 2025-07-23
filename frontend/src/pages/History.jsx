// frontend/src/pages/History.jsx
import React, { useState, useEffect } from 'react';
import resumeService from '../services/resumeService';
// Removed date-fns-tz dependency - using native browser APIs
import '../styles/History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await resumeService.getHistory();
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load enhancement history. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading History...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="page-container history-page">
      <div className="container">
        <header className="history-page-header">
          <h1>Enhancement History</h1>
          <p>Here is a log of your 5 most recent resume enhancements.</p>
        </header>
        
        <div className="history-list">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.enhancement_id} className="history-item">
                <div className="history-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="history-item-details">
                  <span className="history-filename">{item.original_filename}</span>
                  <p className="history-jd-snippet">
                    <strong>For:</strong> {item.job_description_snippet}
                  </p>
                  <span className="history-date">
                    {/* --- Native browser timezone formatting without external dependencies --- */}
                    {(() => {
                      const date = new Date(item.created_at);
                      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      
                      // Use native Intl.DateTimeFormat for timezone-aware formatting
                      const formatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: userTimezone,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      return formatter.format(date);
                    })()}
                  </span>
                </div>
                <span className={`history-status status-${item.enhancement_status}`}>
                  {item.enhancement_status}
                </span>
              </div>
            ))
          ) : (
            <div className="no-history">
              <p>You have no enhancement history yet.</p>
              <p>Enhance your first resume to see it here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;