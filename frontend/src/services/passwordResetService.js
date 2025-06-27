// frontend/src/services/passwordResetService.js

const API_BASE_URL = 'https://instantresumeai-production.up.railway.app/api'

class PasswordResetService {
  
  /**
   * Step 1: Request password reset (send email with verification code)
   */
  static async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message,
        data: data
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Network error occurred. Please check your connection.',
        error: error.message
      };
    }
  }
  
  /**
   * Step 2: Verify reset token/code
   */
  static async verifyResetToken(email, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          token: token.trim() 
        }),
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        valid: data.valid || false,
        message: data.message
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        valid: false,
        message: 'Network error occurred. Please check your connection.',
        error: error.message
      };
    }
  }
  
  /**
   * Step 3: Reset password with new password
   */
  static async resetPassword(email, token, newPassword, confirmPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          token: token.trim(), 
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message,
        data: data
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Network error occurred. Please check your connection.',
        error: error.message
      };
    }
  }
  
  /**
   * Change password for authenticated user (different from reset)
   */
  static async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Authentication required. Please log in again.'
        };
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
      });
      
      const data = await response.json();
      
      // Handle token expiration
      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return {
          success: false,
          message: 'Session expired. Please log in again.'
        };
      }
      
      return {
        success: response.ok,
        message: data.message,
        data: data
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Network error occurred. Please check your connection.',
        error: error.message
      };
    }
  }
  
  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate password strength
   */
  static validatePassword(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const isValid = Object.values(requirements).every(req => req);
    
    const errors = [];
    if (!requirements.minLength) errors.push('At least 8 characters');
    if (!requirements.hasUppercase) errors.push('One uppercase letter');
    if (!requirements.hasLowercase) errors.push('One lowercase letter');
    if (!requirements.hasNumber) errors.push('One number');
    if (!requirements.hasSpecialChar) errors.push('One special character');
    
    return {
      isValid,
      requirements,
      errors
    };
  }
  
  /**
   * Format verification code input (6 digits only)
   */
  static formatVerificationCode(input) {
    return input.replace(/\D/g, '').substring(0, 6);
  }
}

export default PasswordResetService;