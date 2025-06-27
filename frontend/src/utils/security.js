export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove any script tags or dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  export const validateFileType = (file, allowedTypes) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Check MIME type
    if (!allowedTypes.includes(fileType)) {
      return false;
    }
    
    // Double-check file extension
    const extension = fileName.split('.').pop();
    const allowedExtensions = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'text/plain': ['txt']
    };
    
    const validExtensions = allowedTypes.flatMap(type => allowedExtensions[type] || []);
    return validExtensions.includes(extension);
  };
  
  export const validateFileSize = (file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  };