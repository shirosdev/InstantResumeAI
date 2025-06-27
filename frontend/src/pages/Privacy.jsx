import React from 'react';

const Privacy = () => {
  return (
    <div className="page-container">
      <div className="container">
        <h1>Privacy Policy</h1>
        <div className="legal-content">

          <p className="last-updated">Last Updated: April 2025</p>
          <h2>1. Introduction</h2>
          <p>
            InstantResumeAI collects information you provide directly to us, including your name, email address, 
            and resume content. We use this information solely to provide our resume enhancement services.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>
              <b>Registration & Profile Data</b> <br />
              
              Full Name, Date of Birth, Email Address, Contact Number, Postal Address, Password. <br />
                <br />
              <b>Resume & Job Description Content </b><br />
                
              Uploaded DOCX file and pasted job description text.<br />
                <br />
              <b>Usage & Technical Data</b> <br />
                
              IP address, browser type, device information, timestamps, cookies and other tracking technologies. <br />
                <br />
              <b>Payment Data </b><br />
                
              Billing name, card details processed via Stripe (we do not store full card numbers).
          </p>
          
          <h2>2. How We Use Your Information</h2>
          <p>
            <b>Service Delivery: </b> Enhance resumes based on your inputs. <br />
            <br />
            
             <b>Account Management: </b> Authenticate, communicate updates, reset passwords. <br />
             <br />
              
            <b>Payments & Billing: </b> Process subscriptions, billing, refunds via Stripe. <br />
            <br />
              
            <b>Analytics & Improvements:</b> Measure usage, improve AI models, optimize performance. <br />
            <br />
              
             <b>Legal Compliance:</b> Prevent fraud, respond to lawful requests.
          </p>
          
          <h2>3. Data Security</h2>
          <p>
            We implement industry-standard technical and administrative measures (encryption in transit, 
            secure servers, access controls) to protect your data. However, no system is completely foolproof.
          </p>
          
          <h2>4. Data Retention</h2>
          <p>
            Enhanced resumes and associated inputs are stored for 7 days in your dashboard and then permanently deleted.
          </p>
          
          <h2>5. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at info@instantresumeai.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
