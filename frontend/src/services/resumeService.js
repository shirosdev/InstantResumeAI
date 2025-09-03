// frontend/src/services/resumeService.js - Updated with User Instructions

import api from './api';

const resumeService = {
  // Enhanced resume function with user instructions parameter
  enhanceResume: async (resumeFile, jobDescription, userInstructions = '') => {
    const token = localStorage.getItem('access_token');
    console.log('Token present:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('User instructions provided:', !!userInstructions);
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_description', jobDescription);
    formData.append('user_instructions', userInstructions); // Add user instructions to form data
    
    return api.post('/resume/enhance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // --- NEW FUNCTION TO LOG DISCLAIMER AGREEMENT ---
  logDisclaimerAgreement: async (enhancementId) => {
    return api.post('/resume/log-disclaimer-agreement', {
      enhancement_id: enhancementId
    });
  },

  // Download enhanced resume
  downloadResume: async (resumeId) => {
    try {
      const response = await api.get(`/resume/download/${resumeId}`, {
        responseType: 'blob',
        // Ensure axios doesn't try to parse the response as JSON
        transformResponse: [(data) => data]
      });
      
      // Check if the response is actually a blob
      if (!(response.data instanceof Blob)) {
        // If the response is not a blob, it might be an error message
        // Try to read it as text
        const text = await new Response(response.data).text();
        console.error('Download failed - Response is not a blob:', text);
        throw new Error('Invalid response format from server');
      }
      
      // Extract filename from response headers
      let filename = `enhanced_resume_${new Date().getTime()}.docx`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      console.log('Download successful:', {
        contentType: response.headers['content-type'],
        contentDisposition: contentDisposition,
        filename: filename,
        dataSize: response.data.size
      });
      
      // Create blob with proper MIME type
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Append to body, click, and clean up
      document.body.appendChild(link);
      link.click();
      
      // Clean up with a slight delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return response;
      
    } catch (error) {
      console.error('Download error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error('Resume file not found. It may have been deleted.');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else {
        throw error;
      }
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
  },

  // Validate user instructions
  validateInstructions: (instructions) => {
    const maxLength = 1000;
    const minLength = 10;
    
    if (instructions.length > maxLength) {
      return { valid: false, error: `Instructions must be less than ${maxLength} characters` };
    }
    
    if (instructions.trim().length < minLength && instructions.length > 0) {
      return { valid: false, error: `Instructions should be at least ${minLength} characters if provided` };
    }
    
    // More precise problematic patterns with word boundaries
    const problematicPatterns = [
      /\bcompletely\s+rewrite\s+everything\b/i,
      /\bignore\s+the\s+resume\b/i,
      /\bmake\s+up\s+(experience|skills|education|facts)\b/i,
      /\bfabricate\s+(experience|information|credentials)\b/i,
      /\blie\s+about\b/i,
      /\binvent\s+(experience|qualifications|skills)\b/i,
      /\bfalse\s+information\b/i
    ];
    
    for (const pattern of problematicPatterns) {
      if (pattern.test(instructions)) {
        return { 
          valid: false, 
          error: 'Instructions should guide enhancement, not request fabrication of information' 
        };
      }
    }
    
    return { valid: true };
  }
};

export default resumeService;