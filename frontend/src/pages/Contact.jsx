import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Thank you for your message. Our executive will get back to you in 24 hours!');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="page-container">
      <div className="container">
        <h1>Contact Us</h1>
        <div className="contact-content">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p>We're here to help you. Reach out with any questions or feedback.</p>
            
            <div className="contact-details">
              <div className="contact-item">
                <h3>Email</h3>
                <p>info@instantresumeai.com</p>
              </div>
              <div className="contact-item">
                <h3>Phone</h3>
                <p>(800) 971-8013</p>
              </div>
              <div className="contact-item">
                <h3>Business Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM CST</p>
              </div>
            </div>
          </div>
          
          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="submit-button">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;