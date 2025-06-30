// frontend/src/services/resumeService.js

import api from './api';
console.log("check api key");
const resumeService = {
  // Enhance resume with job description
  enhanceResume: async (resumeFile, jobDescription) => {
    const token = localStorage.getItem('access_token');
    console.log('Token present:', !!token);
    console.log('Token length:', token ? token.length : 0);
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_description', jobDescription);
    
    return api.post('/resume/enhance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download enhanced resume
  // Download enhanced resume
downloadResume: async (resumeId) => {
  try {
    const response = await api.get(`/resume/download/${resumeId}`, {
      responseType: 'blob'
    });
    
    // Extract filename from response headers or determine from content type
    let filename = `enhanced_resume_${new Date().getTime()}.docx`; // Default to DOCX
    
    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    } else {
      // Determine file extension from Content-Type header
      const contentType = response.headers['content-type'];
      if (contentType) {
        if (contentType.includes('wordprocessingml.document')) {
          filename = `enhanced_resume_${new Date().getTime()}.docx`;
        } else if (contentType.includes('application/pdf')) {
          filename = `enhanced_resume_${new Date().getTime()}.pdf`;
        } else if (contentType.includes('text/plain')) {
          filename = `enhanced_resume_${new Date().getTime()}.txt`;
        }
      }
    }
    
    console.log('Download details:', {
      contentType: response.headers['content-type'],
      contentDisposition: response.headers['content-disposition'],
      filename: filename,
      dataSize: response.data.size
    });
    
    // Create download with proper DOCX handling
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Ensure the link is added to DOM for compatibility
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response;
    
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
},

  // Get enhancement history
  getHistory: async () => {
    return api.get('/resume/history');
  },

  // Validate file before upload
  validateFile: (file) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtension = '.docx';
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!file.name.toLowerCase().endsWith(allowedExtension) || !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload a DOCX file' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    return { valid: true };
  }
};

export default resumeService;