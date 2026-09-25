// frontend/src/pages/BlogPost.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const BlogPost = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    blogService
      .getPost(postId)
      .then((data) => {
        if (isMounted) setPost(data);
      })
      .catch(() => {
        if (isMounted) setError("This post couldn't be found or is no longer available.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  return (
    <div className="page-container">
      <div className="container blog-post-container">
        <Link to="/blog" className="blog-back-link">
          ← Back to all posts
        </Link>

        {loading && <LoadingSpinner />}

        {!loading && error && <p className="blog-error">{error}</p>}

        {!loading && !error && post && (
          <article className="blog-post-article">
            {/* No separate hero image here - the post's own content already
                opens with its lead image; showing post.thumbnail too would
                duplicate it. Thumbnail is used only on the card/list view. */}
            <h1>{post.title}</h1>
            <p className="blog-date">{formatDate(post.published)}</p>
            {post.categories && post.categories.length > 0 && (
              <div className="blog-post-categories">
                {post.categories.map((cat) => (
                  <span key={cat} className="blog-post-category-tag">
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <div
              className="blog-post-content"
              // Content is sanitized server-side (bleach) before it ever reaches the frontend.
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
