// frontend/src/pages/Blog.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import blogService from '../services/blogService';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    blogService
      .getPosts()
      .then((data) => {
        if (isMounted) setPosts(data);
      })
      .catch(() => {
        if (isMounted) setError('Unable to load blog posts right now. Please try again later.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container">
      <div className="container">
        <h1>InstantResumeAI Blog</h1>
        <p className="page-subtitle">Career insights and resume optimization tips</p>

        {loading && <LoadingSpinner />}

        {!loading && error && <p className="blog-error">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p className="blog-error">No posts published yet — check back soon.</p>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                {post.thumbnail && (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="blog-card-thumbnail"
                    loading="lazy"
                  />
                )}
                <h2>{post.title}</h2>
                <p className="blog-date">{formatDate(post.published)}</p>
                <p className="blog-excerpt">{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="read-more">
                  Read More →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
