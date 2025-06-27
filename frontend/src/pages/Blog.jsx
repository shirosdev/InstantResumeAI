import React from 'react';

const Blog = () => {
  const blogPosts = [
    {
      title: "How to Beat ATS Systems in 2024",
      date: "March 15, 2024",
      excerpt: "Learn the latest strategies for optimizing your resume to pass through Applicant Tracking Systems."
    },
    {
      title: "Top 10 Resume Keywords for Tech Jobs",
      date: "March 10, 2024",
      excerpt: "Discover the most important keywords recruiters look for in technology-related positions."
    },
    {
      title: "The Psychology of Resume Design",
      date: "March 5, 2024",
      excerpt: "Understanding how visual hierarchy and formatting impact recruiter engagement."
    }
  ];

  return (
    <div className="page-container">
      <div className="container">
        <h1>InstantResumeAI Blog</h1>
        <p className="page-subtitle">Career insights and resume optimization tips</p>
        
        <div className="blog-grid">
          {blogPosts.map((post, index) => (
            <article key={index} className="blog-card">
              <h2>{post.title}</h2>
              <p className="blog-date">{post.date}</p>
              <p className="blog-excerpt">{post.excerpt}</p>
              <a href="#" className="read-more">Read More →</a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;