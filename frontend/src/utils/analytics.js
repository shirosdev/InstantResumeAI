// src/utils/analytics.js

// Function to track pageviews
export const pageview = (url) => {
    if (window.gtag) {
      window.gtag('config', 'G-98E2W373LP', {
        page_path: url,
      });
    }
  };
  
  // Function to track a custom event
  export const event = ({ action, category, label, value }) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };