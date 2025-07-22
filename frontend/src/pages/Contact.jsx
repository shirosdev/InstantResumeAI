// frontend/src/pages/Contact.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import contactService from '../services/contactService';
import { getErrorMessage } from '../utils/errorMessages';

const Contact = () => {
  const { user } = useAuth(); // Get user from auth context

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Effect to pre-populate email if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({ ...prevData, email: user.email }));
    }
  }, [user]); // Reruns when the user logs in or out

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await contactService.sendMessage(formData);
      setSuccess(response.data.message);
      // Clear form on success, keeping email if user is logged in
      setFormData({
        name: '',
        email: user ? user.email : '',
        subject: '',
        message: ''
      });
    } catch (err) { // <-- CORRECTED THIS LINE
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container contact-page">
      <div className="container">
        <header className="contact-page-header">
          <h1>Get In Touch</h1>
          <p>We'd love to hear from you. Please fill out the form below or use our contact details.</p>
        </header>

        <div className="contact-card">
          <div className="contact-details-grid">
            <div className="contact-detail-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3>Email Us</h3>
              <a href="mailto:info@instantresumeai.com">info@instantresumeai.com</a>
            </div>
            <div className="contact-detail-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <h3>Call Us</h3>
              <p>(800) 971-8013</p>
            </div>
            <div className="contact-detail-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3>Business Hours</h3>
              <p>Mon - Fri: 9 AM - 6 PM CST</p>
            </div>
          </div>

          <hr className="contact-divider" />

          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              {success && <p className="success-message">{success}</p>}
              {error && <p className="error-message">{error}</p>}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Your Email</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={!!user || isLoading} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleChange} required disabled={isLoading}></textarea>
              </div>
              <div className="button-wrapper">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;