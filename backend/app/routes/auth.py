# backend/app/routes/auth.py
# --- FULLY CORRECTED FILE ---

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app import db, bcrypt
from app.models.user import User
from app.models.activity import ActivityLog
from app.models.session import UserSession
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.models.transactions import Transaction
from app.services.email_service import EmailService
from app.services.auth_service import AuthService
from app.services.password_reset_service import PasswordResetService
from app.utils.validators import validate_email, validate_password, validate_username
from app.models.transactions import Transaction
from app.models.resume import ResumeEnhancement
from datetime import datetime, timedelta, date
import re
import uuid

auth_bp = Blueprint('auth', __name__)

password_reset_service = PasswordResetService()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        if not username or not email or not password:
            return jsonify({'message': 'Username, email, and password are required'}), 400
        
        if not validate_username(username):
            return jsonify({'message': 'Username must be 3-50 characters long and contain only letters, numbers, and underscores'}), 400
        
        if not validate_email(email):
            return jsonify({'message': 'Invalid email address'}), 400
        
        is_valid_password, password_error = validate_password(password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 409
        
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=False
        )
        
        db.session.add(new_user)
        db.session.commit()

        try:
            email_service = EmailService()
            email_service.send_welcome_email(to_email=new_user.email, user_name=new_user.first_name or new_user.username)
        except Exception as e:
            print(f"Failed to send welcome email to {new_user.email}: {e}")
        
        AuthService.log_activity(
            new_user.user_id, 
            'user_registered', 
            f'User {username} registered', 
            request.remote_addr,
            request.user_agent.string
        )
        
        access_token = create_access_token(identity=str(new_user.user_id))
        refresh_token = create_refresh_token(identity=str(new_user.user_id))
        
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
        login_identifier = data.get('login', '').strip()
        password = data.get('password', '')
        
        if not login_identifier or not password:
            return jsonify({'message': 'Login credentials are required'}), 400
        
        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier.lower())
        ).first()
        
        if not user or not user.password_hash or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 403
        
        user.last_login = datetime.utcnow()
        
        session_token = str(uuid.uuid4())
        
        new_session = UserSession(
            user_id=user.user_id,
            session_token=session_token,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.session.add(new_session)

        AuthService.log_activity(
            user.user_id, 
            'user_login', 
            f'User {user.username} logged in', 
            request.remote_addr,
            request.user_agent.string
        )
        
        db.session.commit()
        
        access_token = create_access_token(
            identity=str(user.user_id), 
            additional_claims={'session_token': session_token}
        )
        refresh_token = create_refresh_token(identity=str(user.user_id))

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and invalidate session"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        session_token = claims.get('session_token')

        if session_token:
            session_to_invalidate = UserSession.query.filter_by(session_token=session_token).first()
            if session_to_invalidate and session_to_invalidate.user_id == int(current_user_id):
                session_to_invalidate.is_active = False
                session_to_invalidate.expires_at = datetime.utcnow()
                db.session.commit()

        AuthService.log_activity(
            current_user_id, 
            'user_logout', 
            'User logged out', 
            request.remote_addr,
            request.user_agent.string
        )
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Logout failed', 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 401
        new_access_token = create_access_token(identity=str(current_user_id))
        return jsonify({'access_token': new_access_token}), 200
    except Exception as e:
        return jsonify({'message': 'Token refresh failed', 'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch user profile', 'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        if not email or not validate_email(email):
            return jsonify({'message': 'Valid email address is required'}), 400
        
        success, message = password_reset_service.initiate_password_reset(
            email=email,
            ip_address=request.remote_addr
        )
        return jsonify({'message': message, 'success': success}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to process password reset request', 'error': str(e)}), 500

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        token = data.get('token', '').strip()
        if not email or not token or not validate_email(email):
            return jsonify({'message': 'Email and verification code are required'}), 400
        
        is_valid, message, user = password_reset_service.verify_reset_token(email, token)
        if is_valid:
            return jsonify({'message': message, 'valid': True}), 200
        else:
            return jsonify({'message': message, 'valid': False}), 400
            
    except Exception as e:
        return jsonify({'message': 'Failed to verify reset token', 'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not all([email, token, new_password, confirm_password]):
            return jsonify({'message': 'All fields are required'}), 400
        
        if new_password != confirm_password:
            return jsonify({'message': 'Passwords do not match'}), 400
        
        is_valid_password, password_error = validate_password(new_password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        success, message = password_reset_service.reset_password(
            email=email,
            token=token,
            new_password=new_password,
            ip_address=request.remote_addr
        )
        
        if success:
            return jsonify({'message': message, 'success': True}), 200
        else:
            return jsonify({'message': message, 'success': False}), 400
            
    except Exception as e:
        return jsonify({'message': 'Failed to reset password', 'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not all([current_password, new_password, confirm_password]):
            return jsonify({'message': 'All fields are required'}), 400
        
        if not bcrypt.check_password_hash(user.password_hash, current_password):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        if new_password != confirm_password:
            return jsonify({'message': 'New passwords do not match'}), 400
            
        is_valid_password, password_error = validate_password(new_password)
        if not is_valid_password:
            return jsonify({'message': password_error}), 400
        
        if bcrypt.check_password_hash(user.password_hash, new_password):
            return jsonify({'message': 'New password must be different from current password'}), 400
        
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        email_service = password_reset_service.email_service
        email_service.send_password_change_confirmation(to_email=user.email, user_name=user.first_name)
        
        AuthService.log_activity(
            user.user_id,
            'password_changed',
            'Password changed by authenticated user',
            request.remote_addr
        )
        
        return jsonify({'message': 'Password changed successfully', 'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to change password', 'error': str(e)}), 500
    
@auth_bp.route('/profile', methods=['PUT', 'PATCH'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        allowed_fields = ['first_name', 'last_name', 'phone_number', 'profession', 'location', 'bio']
        updated_fields = []
        for field in allowed_fields:
            if field in data:
                value = data[field]
                if value is not None:
                    value = str(value).strip()
                setattr(user, field, value if value else None)
                updated_fields.append(field)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        AuthService.log_activity(
            current_user_id,
            'profile_updated',
            f'Profile updated: {", ".join(updated_fields)}',
            request.remote_addr
        )
        
        return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500
    
@auth_bp.route('/status', methods=['GET'])
@jwt_required()
def get_user_status():
    """
    This is the primary endpoint for the frontend to get user status.
    It handles plan expiry, monthly resets, and calculates credits correctly.
    """
    try:
        current_user_id = int(get_jwt_identity())
        db.session.expire_all()
        user_subscription = UserSubscription.query.filter_by(user_id=current_user_id).first()
        
        if not user_subscription:
            return jsonify({'message': 'No active subscription found for user'}), 404
            
        plan = SubscriptionPlan.query.get(user_subscription.plan_id)
        if not plan:
            return jsonify({'message': 'Subscription plan not found'}), 404

        # --- 1. CHECK FOR PLAN EXPIRATION ---
        if plan.plan_type != 'free' and user_subscription.end_date and user_subscription.end_date < date.today():
            print(f"User {current_user_id}'s plan has expired. Reverting to Freemium.")
            freemium_plan = SubscriptionPlan.query.filter_by(plan_name='Freemium').first()
            if freemium_plan:
                user_subscription.plan_id = freemium_plan.plan_id
                user_subscription.start_date = date.today()
                user_subscription.end_date = None
                user_subscription.status = 'active'
                user_subscription.monthly_enhancements_used = 0
                user_subscription.credits_reset_at = datetime.utcnow()
                db.session.commit()
                plan = freemium_plan
        
        # --- 2. CHECK FOR MONTHLY CREDIT RESET ---
        # Calculate next reset date (30 days after the last one)
        # We'll use 30 days as a standard "month" for simplicity
        next_reset_date = user_subscription.credits_reset_at + timedelta(days=30)
        
        if datetime.utcnow() >= next_reset_date:
            print(f"Resetting monthly credits for user {current_user_id}.")
            user_subscription.monthly_enhancements_used = 0
            user_subscription.credits_reset_at = datetime.utcnow()
            db.session.commit()
            # Update the reset date for the response
            next_reset_date = datetime.utcnow() + timedelta(days=30)

        # --- 3. CALCULATE CREDITS (MODIFIED) ---
        purchased_credits = user_subscription.enhancement_credits or 0
        monthly_limit = plan.resume_limit if plan.resume_limit is not None else 0
        used_this_month = user_subscription.monthly_enhancements_used or 0
        
        remaining_plan_credits = max(0, monthly_limit - used_this_month)
        
        # Grand total
        total_remaining_enhancements = remaining_plan_credits + purchased_credits
        
        # --- 4. PREPARE DISPLAY NAME (Unchanged) ---
        display_plan_name = plan.plan_name
        if purchased_credits > 0:
             display_plan_name = f"{plan.plan_name} (+ {purchased_credits} Top-up)"

        has_invoice_history = db.session.query(
            Transaction.query.filter_by(user_id=current_user_id, status='completed')
                           .exists()
        ).scalar()

        # --- 5. BUILD THE NEW RESPONSE (THE FIX) ---
        return jsonify({
            'message': 'User status retrieved successfully',
            'status': {
                'plan_name': display_plan_name,
                'plan_id': plan.plan_id,
                
                # --- NEW DETAILED CREDIT INFO ---
                'plan_credit_limit': monthly_limit,           # e.g., 30 (for "Starter")
                'plan_credits_used': used_this_month,         # e.g., 0
                'remaining_plan_credits': remaining_plan_credits, # e.g., 30
                'purchased_credits': purchased_credits,         # e.g., 0 (or 5 if they topped up)
                'total_remaining_enhancements': total_remaining_enhancements, # e.g., 30
                'credits_reset_date': next_reset_date.isoformat() + 'Z', # e.g., "2025-12-11T...Z"
                # --- END NEW INFO ---

                # --- LEGACY FIELDS (for compatibility, but we'll stop using them) ---
                'enhancement_count': used_this_month, 
                'remaining_enhancements': total_remaining_enhancements,
                'total_available': monthly_limit + purchased_credits, 
                
                'has_invoice_history': has_invoice_history
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(traceback.format_exc()) # Print full traceback for debugging
        return jsonify({'message': 'Failed to retrieve user status', 'error': str(e)}), 500


@auth_bp.route('/cleanup-expired-tokens', methods=['POST'])
def cleanup_expired_tokens():
    try:
        cleaned_count = password_reset_service.cleanup_expired_tokens()
        return jsonify({'message': f'Cleaned up {cleaned_count} expired tokens', 'count': cleaned_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to cleanup expired tokens', 'error': str(e)}), 500