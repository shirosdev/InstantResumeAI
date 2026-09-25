// frontend/src/services/blogService.js

import api from './api';

const blogService = {
  getPosts: async () => {
    const response = await api.get('/blog/posts');
    return response.data.posts;
  },
  getPost: async (postId) => {
    const response = await api.get(`/blog/posts/${postId}`);
    return response.data.post;
  },
};

export default blogService;
