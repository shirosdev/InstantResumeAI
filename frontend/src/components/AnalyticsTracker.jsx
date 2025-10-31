// src/components/AnalyticsTracker.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // This is the standard GTM way to track page views
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'pageview',
      page: {
        path: location.pathname + location.search,
        title: document.title,
      },
    });
  }, [location]); // This effect runs every time the location (route) changes

  return null; // This component does not render anything
};

export default AnalyticsTracker;