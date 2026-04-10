import React, { useState, useEffect } from 'react';
 
const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
 
  useEffect(() => {
    const consent = localStorage.getItem('user_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      loadTrackingScripts();
    }
  }, []);
 
  const loadTrackingScripts = () => {
    // Check if script already exists to avoid duplicates
    if (document.getElementById('google-analytics-script')) return;
 
    const gaScript = document.createElement('script');
    gaScript.id = 'google-analytics-script';
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-98E2W373LP";
    gaScript.async = true;
    document.head.appendChild(gaScript);
   
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-98E2W373LP');
  };
 
  const handleAccept = () => {
    localStorage.setItem('user_cookie_consent', 'accepted');
    setShowBanner(false);
    loadTrackingScripts();
  };
 
  const handleReject = () => {
    localStorage.setItem('user_cookie_consent', 'rejected');
    setShowBanner(false);
  };
 
  if (!showBanner) return null;
 
  // Using inline styles to ensure compatibility if Tailwind is not configured
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#111827',
      borderTop: '1px solid #374151',
      padding: '20px',
      zIndex: 1000,
      color: 'white',
      boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ fontSize: '14px', color: '#D1D5DB' }}>
          <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>GDPR & Privacy Compliance</p>
          We use strictly necessary cookies to make our site work. We also use optional analytics cookies to improve your experience.
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleReject}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '1px solid #6B7280',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}>
            Reject
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: '#DC2626',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default CookieConsent;
