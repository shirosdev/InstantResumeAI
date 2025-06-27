export const getErrorMessage = (error) => {
    // Network errors
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network and try again.';
    }
  
    // Server errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
  
      switch (status) {
        case 400:
          return message || 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return message || 'This action conflicts with existing data.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Our team has been notified. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again in a few minutes.';
        default:
          return message || 'An unexpected error occurred. Please try again.';
      }
    }
  
    // Request setup errors
    if (error.request) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
  
    // Other errors
    return error.message || 'An unexpected error occurred. Please try again.';
  };