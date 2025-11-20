// src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  type = 'website', 
  image,
  schema,
  canonical
}) => {
  const location = useLocation();
  const siteUrl = 'https://www.instantresumeai.com';
  const currentUrl = canonical || `${siteUrl}${location.pathname}`;
  
  // Default OG image if none provided
  const ogImage = image || `${siteUrl}/og-image-default.png`;
  
  // Full page title
  const fullTitle = title ? `${title} | InstantResumeAI` : 'InstantResumeAI - AI Resume Builder & ATS Optimizer';
  
  // Default description if none provided
  const seoDescription = description || 'Free AI resume builder that beats ATS systems. Instantly match your resume to job descriptions with our resume tailoring tool.';
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={seoDescription} />
      {keywords && <meta name='keywords' content={keywords} />}
      <link rel='canonical' href={currentUrl} />
      
      {/* Open Graph / Facebook / LinkedIn */}
      <meta property='og:type' content={type} />
      <meta property='og:url' content={currentUrl} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={seoDescription} />
      <meta property='og:image' content={ogImage} />
      <meta property='og:site_name' content="InstantResumeAI" />
      <meta property='og:locale' content="en_US" />
      
      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:url' content={currentUrl} />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={seoDescription} />
      <meta name='twitter:image' content={ogImage} />
      
      {/* Additional SEO */}
      <meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' />
      <meta name='googlebot' content='index, follow' />
      <meta name='author' content='InstantResumeAI' />
      
      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : [schema])}
        </script>
      )}
      
      {/* Breadcrumb Schema (automatically generated) */}
      {location.pathname !== '/' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": title || "Page",
                "item": currentUrl
              }
            ]
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;