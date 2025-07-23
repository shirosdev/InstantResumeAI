# backend/app/routes/auth.py - Updated with Password Reset Functionality

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.user import User
from app.models.activity import ActivityLog
from app.services.auth_service import AuthService
from app.services.password_reset_service import PasswordResetService
from app.utils.validators import validate_email, validate_password, validate_username
from app.models.resume import ResumeEnhancement
from datetime import datetime
import re

auth_bp = Blueprint('auth', __name__)

# Initialize password reset service
password_reset_service = PasswordResetService()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Extract and validate required fields
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validate input
        if not username or not email or not password:
            return jsonify({'message': 'Username, email, and password are required'}), 400
        
        # Validate username
        if not validate_username(username):
            return jsonify({
                'message': 'Username must be 3-50 characters long and contain only letters, numbers, and underscores'
            }), 400
        
        # Validate email
        if not validate_email(email):
            return jsonify({'message': 'Invalid email address'}), 400
        
        # Validate password
        is_valid_password, password_error = validate_password(password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 409
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=False  # Email verification to be implemented later
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log registration activity
        AuthService.log_activity(new_user.user_id, 'user_registered', f'User {username} registered', request.remote_addr)
        
        # Create tokens
        access_token = create_access_token(identity=str(new_user.user_id))
        refresh_token = create_refresh_token(identity=str(new_user.user_id))
        
        # Assign free subscription
        AuthService.assign_free_subscription(new_user.user_id)
        
        return jsonify({
            'message': 'Registration successful',
            'user': new_user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with username/email and password"""
    try:
        data = request.get_json()
        login_identifier = data.get('login', '').strip()  # Can be username or email
        password = data.get('password', '')
        
        if not login_identifier or not password:
            return jsonify({'message': 'Login credentials are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier.lower())
        ).first()
        
        if not user or not user.password_hash:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Verify password
        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log login activity
        AuthService.log_activity(user.user_id, 'user_login', f'User {user.username} logged in', request.remote_addr)
        
        # Create tokens
        access_token = create_access_token(identity=str(user.user_id))
        refresh_token = create_refresh_token(identity=str(user.user_id))

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user still exists and is active
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 401
        
        # Create new access token
        new_access_token = create_access_token(identity=str(current_user_id))
        
        return jsonify({
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Token refresh failed', 'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch user profile', 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Log logout activity
        AuthService.log_activity(current_user_id, 'user_logout', 'User logged out', request.remote_addr)
        
        # In a production app, you might want to blacklist the token here
        # For now, we'll just return success and let the client discard the token
        
        return jsonify({
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Logout failed', 'error': str(e)}), 500

# =============================================================================
# PASSWORD RESET FUNCTIONALITY
# =============================================================================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Initiate password reset process
    Send verification code to user's email
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        # Validate input
        if not email:
            return jsonify({'message': 'Email address is required'}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email address format'}), 400
        
        # Initiate password reset
        success, message = password_reset_service.initiate_password_reset(
            email=email,
            ip_address=request.remote_addr
        )
        
        # Always return 200 for security (don't reveal if email exists)
        # The actual success/failure is handled in the service layer
        return jsonify({
            'message': message,
            'success': success
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Failed to process password reset request',
            'error': str(e)
        }), 500

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """
    Verify the password reset token/code
    This endpoint allows frontend to validate token before showing password reset form
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        token = data.get('token', '').strip()
        
        # Validate input
        if not email or not token:
            return jsonify({'message': 'Email and verification code are required'}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email address format'}), 400
        
        # Verify token
        is_valid, message, user = password_reset_service.verify_reset_token(email, token)
        
        if is_valid:
            return jsonify({
                'message': message,
                'valid': True
            }), 200
        else:
            return jsonify({
                'message': message,
                'valid': False
            }), 400
            
    except Exception as e:
        return jsonify({
            'message': 'Failed to verify reset token',
            'error': str(e)
        }), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Complete password reset with new password
    Requires valid email, token, and new password
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validate input
        if not email or not token or not new_password:
            return jsonify({'message': 'Email, verification code, and new password are required'}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email address format'}), 400
        
        # Validate password confirmation
        if new_password != confirm_password:
            return jsonify({'message': 'Passwords do not match'}), 400
        
        # Validate new password strength
        is_valid_password, password_error = validate_password(new_password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        # Reset password
        success, message = password_reset_service.reset_password(
            email=email,
            token=token,
            new_password=new_password,
            ip_address=request.remote_addr
        )
        
        if success:
            return jsonify({
                'message': message,
                'success': True
            }), 200
        else:
            return jsonify({
                'message': message,
                'success': False
            }), 400
            
    except Exception as e:
        return jsonify({
            'message': 'Failed to reset password',
            'error': str(e)
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change password for authenticated user (different from reset)
    Requires current password for verification
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validate input
        if not current_password or not new_password:
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not user.password_hash or not bcrypt.check_password_hash(user.password_hash, current_password):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Validate password confirmation
        if new_password != confirm_password:
            return jsonify({'message': 'New passwords do not match'}), 400
        
        # Validate new password strength
        is_valid_password, password_error = validate_password(new_password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        # Check if new password is different from current
        if bcrypt.check_password_hash(user.password_hash, new_password):
            return jsonify({'message': 'New password must be different from current password'}), 400
        
        # Hash and update new password
        password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password_hash = password_hash
        db.session.commit()
        
        # Send confirmation email
        email_service = password_reset_service.email_service
        email_service.send_password_change_confirmation(
            to_email=user.email,
            user_name=user.first_name
        )
        
        # Log password change activity
        AuthService.log_activity(
            user.user_id,
            'password_changed',
            'Password changed by authenticated user',
            request.remote_addr
        )
        
        return jsonify({
            'message': 'Password changed successfully',
            'success': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Failed to change password',
            'error': str(e)
        }), 500
    
@auth_bp.route('/profile', methods=['PUT', 'PATCH'])
@jwt_required()
def update_profile():
    """Update user profile information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Define allowed profile fields for security
        allowed_fields = ['first_name', 'last_name', 'phone_number', 'profession', 'location', 'bio']
        
        # Update only provided and allowed fields
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                # Validate field length and format
                value = data[field]
                if value is not None:
                    value = str(value).strip()
                    
                    # Field-specific validation
                    if field == 'phone_number' and value:
                        if len(value) > 20:
                            return jsonify({'message': 'Phone number too long'}), 400
                    elif field in ['first_name', 'last_name'] and value:
                        if len(value) > 100:
                            return jsonify({'message': f'{field.replace("_", " ").title()} too long'}), 400
                    elif field in ['profession', 'location'] and value:
                        if len(value) > 255:
                            return jsonify({'message': f'{field.title()} too long'}), 400
                    elif field == 'bio' and value:
                        if len(value) > 1000:
                            return jsonify({'message': 'Bio too long (maximum 1000 characters)'}), 400
                
                # Set the field value
                setattr(user, field, value if value else None)
                updated_fields.append(field)
        
        # Update timestamp
        user.updated_at = datetime.utcnow()
        
        # Save changes to database
        db.session.commit()
        
        # Log profile update activity
        AuthService.log_activity(
            current_user_id,
            'profile_updated',
            f'Profile updated: {", ".join(updated_fields)}',
            request.remote_addr
        )
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Failed to update profile',
            'error': str(e)
        }), 500
@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get statistics for the current authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query the database for the count of completed enhancements
        enhancement_count = ResumeEnhancement.query.filter_by(
            user_id=current_user_id, 
            enhancement_status='completed'
        ).count()
        
        return jsonify({
            'message': 'Stats retrieved successfully',
            'stats': {
                'enhancement_count': enhancement_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to retrieve user stats', 'error': str(e)}), 500

# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@auth_bp.route('/cleanup-expired-tokens', methods=['POST'])
def cleanup_expired_tokens():
    """
    Utility endpoint to clean up expired reset tokens
    This could be called by a scheduled job or admin interface
    """
    try:
        # This should be protected in production (admin only or scheduled job)
        # For now, it's open for demonstration
        
        cleaned_count = password_reset_service.cleanup_expired_tokens()
        
        return jsonify({
            'message': f'Cleaned up {cleaned_count} expired tokens',
            'count': cleaned_count
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Failed to cleanup expired tokens',
            'error': str(e)
        }), 500