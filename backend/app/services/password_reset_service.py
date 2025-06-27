# backend/app/services/password_reset_service.py

import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple
from app import db
from app.models.user import User
from app.services.email_service import EmailService
from app.services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

class PasswordResetService:
    """Service for handling password reset functionality"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.token_expiry_minutes = 15  # Reset tokens expire in 15 minutes
        self.max_attempts_per_hour = 5  # Maximum reset attempts per email per hour
    
    def generate_reset_token(self) -> str:
        """
        Generate a secure 6-digit numeric token for password reset
        
        Returns:
            str: 6-digit verification code
        """
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def initiate_password_reset(self, email: str, ip_address: str = None) -> Tuple[bool, str]:
        """
        Initiate password reset process by generating token and sending email
        
        Args:
            email: User's email address
            ip_address: IP address of the request for security logging
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # Normalize email
            email = email.strip().lower()
            
            # Check if user exists
            user = User.query.filter_by(email=email).first()
            if not user:
                # For security, don't reveal if email doesn't exist
                # But still return success to prevent email enumeration
                logger.warning(f"Password reset attempted for non-existent email: {email}")
                return True, "If an account with this email exists, you will receive reset instructions."
            
            # Check if user account is active
            if not user.is_active:
                logger.warning(f"Password reset attempted for inactive account: {email}")
                return False, "Account is not active. Please contact support."
            
            # Check rate limiting (optional security measure)
            if self._is_rate_limited(email, ip_address):
                return False, "Too many reset attempts. Please try again later."
            
            # Generate reset token and expiry
            reset_token = self.generate_reset_token()
            expiry_time = datetime.utcnow() + timedelta(minutes=self.token_expiry_minutes)
            
            # Update user record with reset token
            user.password_reset_token = reset_token
            user.password_reset_expires = expiry_time
            db.session.commit()
            
            # Send reset email
            email_sent = self.email_service.send_password_reset_email(
                to_email=email,
                reset_token=reset_token,
                user_name=user.first_name
            )
            
            if not email_sent:
                # Rollback token if email failed
                user.password_reset_token = None
                user.password_reset_expires = None
                db.session.commit()
                return False, "Failed to send reset email. Please try again."
            
            # Log the reset attempt
            AuthService.log_activity(
                user.user_id,
                'password_reset_requested',
                f'Password reset requested for {email}',
                ip_address
            )
            
            # Log attempt for rate limiting (if table exists)
            self._log_reset_attempt(email, ip_address, success=True)
            
            logger.info(f"Password reset initiated successfully for {email}")
            return True, "Reset instructions have been sent to your email address."
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Password reset initiation failed for {email}: {str(e)}")
            return False, "An error occurred. Please try again."
    
    def verify_reset_token(self, email: str, token: str) -> Tuple[bool, str, Optional[User]]:
        """
        Verify the reset token provided by user
        
        Args:
            email: User's email address
            token: 6-digit verification code
            
        Returns:
            Tuple[bool, str, Optional[User]]: (success, message, user_object)
        """
        try:
            # Normalize inputs
            email = email.strip().lower()
            token = token.strip()
            
            # Validate token format
            if not token.isdigit() or len(token) != 6:
                return False, "Invalid verification code format.", None
            
            # Find user with matching email and token
            user = User.query.filter_by(
                email=email,
                password_reset_token=token
            ).first()
            
            if not user:
                logger.warning(f"Invalid reset token attempt for {email}")
                return False, "Invalid verification code or email address.", None
            
            # Check if token has expired
            if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
                # Clear expired token
                user.password_reset_token = None
                user.password_reset_expires = None
                db.session.commit()
                
                logger.warning(f"Expired reset token used for {email}")
                return False, "Verification code has expired. Please request a new one.", None
            
            # Check if user account is active
            if not user.is_active:
                return False, "Account is not active. Please contact support.", None
            
            logger.info(f"Reset token verified successfully for {email}")
            return True, "Verification code is valid.", user
            
        except Exception as e:
            logger.error(f"Token verification failed for {email}: {str(e)}")
            return False, "An error occurred during verification.", None
    
    def reset_password(self, email: str, token: str, new_password: str, ip_address: str = None) -> Tuple[bool, str]:
        """
        Complete password reset with new password
        
        Args:
            email: User's email address
            token: 6-digit verification code
            new_password: New password to set
            ip_address: IP address for security logging
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # First verify the token
            is_valid, message, user = self.verify_reset_token(email, token)
            if not is_valid or not user:
                return False, message
            
            # Validate new password
            from app.utils.validators import validate_password
            is_valid_password, password_error = validate_password(new_password)
            if not is_valid_password:
                return False, password_error
            
            # Hash the new password
            from app import bcrypt
            password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
            
            # Update user password and clear reset token
            user.password_hash = password_hash
            user.password_reset_token = None
            user.password_reset_expires = None
            db.session.commit()
            
            # Send confirmation email
            self.email_service.send_password_change_confirmation(
                to_email=email,
                user_name=user.first_name
            )
            
            # Log the successful password reset
            AuthService.log_activity(
                user.user_id,
                'password_reset_completed',
                f'Password successfully reset for {email}',
                ip_address
            )
            
            logger.info(f"Password reset completed successfully for {email}")
            return True, "Password has been reset successfully. You can now log in with your new password."
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Password reset failed for {email}: {str(e)}")
            return False, "An error occurred while resetting password. Please try again."
    
    def cleanup_expired_tokens(self) -> int:
        """
        Clean up expired reset tokens from database
        
        Returns:
            int: Number of tokens cleaned up
        """
        try:
            # Find users with expired tokens
            expired_users = User.query.filter(
                User.password_reset_expires < datetime.utcnow()
            ).all()
            
            count = 0
            for user in expired_users:
                user.password_reset_token = None
                user.password_reset_expires = None
                count += 1
            
            db.session.commit()
            logger.info(f"Cleaned up {count} expired reset tokens")
            return count
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Token cleanup failed: {str(e)}")
            return 0
    
    def _is_rate_limited(self, email: str, ip_address: str = None) -> bool:
        """
        Check if email or IP is rate limited for reset attempts
        
        Args:
            email: Email address to check
            ip_address: IP address to check
            
        Returns:
            bool: True if rate limited, False otherwise
        """
        try:
            # Check recent reset attempts from database
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            
            # Count recent reset attempts for this email
            recent_user_attempts = User.query.filter(
                User.email == email,
                User.password_reset_expires > one_hour_ago
            ).count()
            
            if recent_user_attempts >= self.max_attempts_per_hour:
                logger.warning(f"Rate limit exceeded for email: {email}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Rate limiting check failed: {str(e)}")
            return False  # Fail open for availability
    
    def _log_reset_attempt(self, email: str, ip_address: str = None, success: bool = False):
        """
        Log password reset attempt for security monitoring
        
        Args:
            email: Email address of attempt
            ip_address: IP address of attempt
            success: Whether attempt was successful
        """
        try:
            # This would use the password_reset_attempts table if created
            # For now, we rely on the activity_logs table through AuthService
            pass
            
        except Exception as e:
            logger.error(f"Failed to log reset attempt: {str(e)}")
            # Don't fail the main operation if logging fails