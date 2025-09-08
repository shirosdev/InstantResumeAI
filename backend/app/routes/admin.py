# backend/app/routes/admin.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from app.models.user import User
from app.models.activity import ActivityLog
from app.models.session import UserSession
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.resume import ResumeEnhancement
from app import db
from sqlalchemy import func, extract, or_
from datetime import datetime, timedelta
from collections import OrderedDict
from app.models.api_log import ApiLog

admin_bp = Blueprint('admin', __name__)

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("is_admin"):
                return fn(*args, **kwargs)
            else:
                return jsonify(message="Admins only! Access denied."), 403
        return decorator
    return wrapper

@admin_bp.route('/', methods=['GET'])
@admin_required()
def admin_dashboard():
    return jsonify(message="Welcome to the Admin Dashboard!")

@admin_bp.route('/users/stats', methods=['GET'])
@admin_required()
def get_user_stats():
    try:
        total_users = db.session.query(func.count(User.user_id)).scalar()
        active_users = db.session.query(func.count(User.user_id)).filter_by(is_active=True).scalar()
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        new_signups = db.session.query(func.count(User.user_id)).filter(User.created_at >= seven_days_ago).scalar()
        stats = {
            "total_users": total_users,
            "active_users": active_users,
            "new_signups_weekly": new_signups
        }
        return jsonify(stats), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve user stats", error=str(e)), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required()
def get_all_users():
    """Provides a paginated list of all users with search functionality."""
    try:
        page = request.args.get('page', 1, type=int)
        # FIX 1: Changed per_page type from str back to int
        per_page = request.args.get('per_page', 15, type=int)
        search_query = request.args.get('search_query', '', type=str)
        
        query = User.query
        
        if search_query:
            search_term = f"%{search_query}%"
            # FIX 2: Removed the invalid search on the integer user_id field
            query = query.filter(
                or_(
                    User.username.like(search_term),
                    User.email.like(search_term)
                )
            )

        users_pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        users_data = [user.to_dict() for user in users_pagination.items]
        
        return jsonify({
            "users": users_data,
            "total_pages": users_pagination.pages,
            "current_page": users_pagination.page,
            "has_next": users_pagination.has_next,
            "has_prev": users_pagination.has_prev
        }), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve users", error=str(e)), 500

@admin_bp.route('/users/<int:user_id>/activity', methods=['GET'])
@admin_required()
def get_user_security_activity(user_id):
    """Provides detailed security and activity logs for a single user."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        # 1. Login Activity
        login_activities = ActivityLog.query.filter_by(user_id=user_id, action='user_login').order_by(ActivityLog.created_at.desc()).limit(20).all()
        
        # Simple suspicious login detection
        recent_ips = set()
        suspicious_logins = []
        for log in login_activities:
            if log.ip_address not in recent_ips:
                if len(recent_ips) > 0: # Mark as suspicious if IP changes
                    suspicious_logins.append(log.log_id)
                recent_ips.add(log.ip_address)

        login_history = [{
            "id": log.log_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "time": log.created_at.isoformat() + 'Z',
            "is_suspicious": log.log_id in suspicious_logins
        } for log in login_activities]

        # 2. Multi-Login Tracking (Active Sessions)
        active_sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        session_details = [{
            "id": session.session_id,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "last_activity": session.last_activity.isoformat() + 'Z'
        } for session in active_sessions]

        # 3. Data Privacy Compliance Logs (Audit Trail)
        compliance_actions = ['disclaimer_accepted', 'user_data_exported', 'account_deleted']
        compliance_logs = ActivityLog.query.filter(
            ActivityLog.user_id == user_id,
            ActivityLog.action.in_(compliance_actions)
        ).order_by(ActivityLog.created_at.desc()).limit(50).all()

        audit_trail = [{
            "id": log.log_id,
            "action": log.action.replace('_', ' ').title(),
            "description": log.description,
            "time": log.created_at.isoformat() + 'Z'
        } for log in compliance_logs]

        return jsonify({
            "login_history": login_history,
            "active_sessions": session_details,
            "audit_trail": audit_trail
        }), 200

    except Exception as e:
        return jsonify(message="Failed to retrieve user activity", error=str(e)), 500


@admin_bp.route('/users/chart-data', methods=['GET'])
@admin_required()
def get_chart_data():
    """Provides data for the admin dashboard charts."""
    try:
        today = datetime.utcnow()
        six_months_ago = today - timedelta(days=180)

        monthly_signups_data = db.session.query(
            func.count(User.user_id),
            extract('year', User.created_at),
            extract('month', User.created_at)
        ).filter(User.created_at >= six_months_ago).group_by(
            extract('year', User.created_at),
            extract('month', User.created_at)
        ).all()

        signups_dict = {(year, month): count for count, year, month in monthly_signups_data}

        months = []
        for i in range(6):
            month_date = today - timedelta(days=30*i)
            months.append((month_date.year, month_date.month))
        months.reverse()

        monthly_signups = []
        for year, month in months:
            count = signups_dict.get((year, month), 0)
            monthly_signups.append({"count": count, "year": year, "month": month})

        plan_distribution = db.session.query(
            SubscriptionPlan.plan_name,
            func.count(UserSubscription.user_id)
        ).join(UserSubscription, UserSubscription.plan_id == SubscriptionPlan.plan_id).group_by(SubscriptionPlan.plan_name).all()

        chart_data = {
            "monthly_signups": monthly_signups,
            "plan_distribution": [{"plan_name": name, "count": count} for name, count in plan_distribution]
        }
        return jsonify(chart_data), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve chart data", error=str(e)), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required()
def get_user(user_id):
    """Provides detailed information for a single user."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve user details", error=str(e)), 500

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@admin_required()
def update_user_status(user_id):
    """Updates a user's active status."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404
            
        data = request.get_json()
        if 'is_active' not in data:
            return jsonify(message="Missing 'is_active' field"), 400
            
        user.is_active = data['is_active']
        db.session.commit()
        
        return jsonify(message="User status updated successfully", user=user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Failed to update user status", error=str(e)), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required()
def delete_user(user_id):
    """Deletes a user from the database."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404
            
        db.session.delete(user)
        db.session.commit()
        
        return jsonify(message="User deleted successfully"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Failed to delete user", error=str(e)), 500
    
@admin_bp.route('/usage-tracking', methods=['GET'])
@admin_required()
def get_usage_tracking_data():
    """Provides data for resume usage tracking."""
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_enhancements = db.session.query(
            func.date(ResumeEnhancement.created_at),
            func.count(ResumeEnhancement.enhancement_id)
        ).filter(ResumeEnhancement.created_at >= thirty_days_ago).group_by(
            func.date(ResumeEnhancement.created_at)
        ).order_by(func.date(ResumeEnhancement.created_at).desc()).all()

        enhancements_per_user = db.session.query(
            User.user_id,
            User.username,
            func.count(ResumeEnhancement.enhancement_id)
        ).join(User, User.user_id == ResumeEnhancement.user_id).group_by(
            User.user_id, User.username
        ).order_by(
            func.count(ResumeEnhancement.enhancement_id).desc()
        ).limit(10).all()

        total_enhancements = db.session.query(func.count(ResumeEnhancement.enhancement_id)).scalar()
        enhancements_with_instructions = ResumeEnhancement.query.filter(
            ResumeEnhancement.enhancement_summary.isnot(None)
        ).count()

        usage_data = {
            "daily_enhancements": [{"date": date.isoformat(), "count": count} for date, count in daily_enhancements],
            "enhancements_per_user": [{"user_id": user_id, "username": username, "count": count} for user_id, username, count in enhancements_per_user],
            "prompt_usage": {
                "with_instructions": enhancements_with_instructions,
                "total": total_enhancements
            }
        }
        return jsonify(usage_data), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve usage tracking data", error=str(e)), 500

@admin_bp.route('/users/<int:user_id>/enhancement-history', methods=['GET'])
@admin_required()
def get_user_enhancement_history(user_id):
    """Provides a daily breakdown of enhancements for a specific user."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        daily_enhancements = db.session.query(
            func.date(ResumeEnhancement.created_at),
            func.count(ResumeEnhancement.enhancement_id)
        ).filter_by(user_id=user_id).group_by(
            func.date(ResumeEnhancement.created_at)
        ).order_by(func.date(ResumeEnhancement.created_at).desc()).all()

        history_data = [{"date": date.isoformat(), "count": count} for date, count in daily_enhancements]
        
        return jsonify({
            "username": user.username,
            "history": history_data
        }), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve enhancement history", error=str(e)), 500

@admin_bp.route('/system/stats', methods=['GET'])
@admin_required()
def get_system_stats():
    """Provides aggregated stats for the System Monitoring dashboard."""
    try:
        # --- 1. API Health Stats (last 24 hours) ---
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        # Base query for recent API logs
        recent_logs_query = ApiLog.query.filter(ApiLog.timestamp >= twenty_four_hours_ago)
        
        # Average response time
        avg_response_time = recent_logs_query.with_entities(func.avg(ApiLog.response_time_ms)).scalar()
        
        # Error rate
        total_requests = recent_logs_query.count()
        server_errors = recent_logs_query.filter(ApiLog.status_code >= 500).count()
        error_rate = (server_errors / total_requests * 100) if total_requests > 0 else 0
        
        # Slowest endpoints
        slowest_endpoints = db.session.query(
            ApiLog.endpoint,
            ApiLog.method,
            func.avg(ApiLog.response_time_ms).label('avg_time')
        ).filter(ApiLog.timestamp >= twenty_four_hours_ago).group_by(
            ApiLog.endpoint, ApiLog.method
        ).order_by(func.avg(ApiLog.response_time_ms).desc()).limit(5).all()

        # --- 2. Background Job Stats (all time) ---
        job_stats = db.session.query(
            ResumeEnhancement.enhancement_status,
            func.count(ResumeEnhancement.enhancement_id)
        ).group_by(ResumeEnhancement.enhancement_status).all()
        
        recent_failed_jobs = ResumeEnhancement.query.filter_by(enhancement_status='failed')\
            .order_by(ResumeEnhancement.completed_at.desc()).limit(5).all()

        # --- 3. External Service Status (Placeholder) ---
        # In a real implementation, you would ping the OpenAI status API here
        openai_status = {"indicator": "operational", "description": "All Systems Operational"}

        return jsonify({
            "api_health": {
                "avg_response_time": round(avg_response_time, 2) if avg_response_time else 0,
                "error_rate_percent": round(error_rate, 2),
                "slowest_endpoints": [
                    {"endpoint": e.endpoint, "method": e.method, "avg_time": round(e.avg_time, 2)} for e in slowest_endpoints
                ]
            },
            "job_processing": {
                "status_counts": {status: count for status, count in job_stats},
                "recent_failures": [
                    {
                        "enhancement_id": job.enhancement_id, 
                        "user_id": job.user_id, 
                        "failed_at": job.completed_at.isoformat() + 'Z' if job.completed_at else None
                    } for job in recent_failed_jobs
                ]
            },
            "external_services": {
                "openai_api": openai_status
            }
        }), 200

    except Exception as e:
        return jsonify(message="Failed to retrieve system monitoring stats", error=str(e)), 500