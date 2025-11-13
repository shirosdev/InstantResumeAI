# backend/app/routes/admin.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from app.models.user import User
from app.models.activity import ActivityLog
from app.models.session import UserSession
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.resume import ResumeEnhancement
# --- ADDED: Transaction import ---
from app.models.transactions import Transaction
from app import db
from sqlalchemy import func, extract, or_
# --- ADDED: timezone import ---
from datetime import datetime, timedelta, timezone
from collections import OrderedDict
from app.models.api_log import ApiLog
from app.models.support_ticket import SupportTicket
from app.models.ticket_reply import TicketReply
from flask_jwt_extended import get_jwt_identity
from app.services.email_service import EmailService
import os

# Optional: Google Analytics imports (keep if you are using them)
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Metric, RunReportRequest
    )
except ImportError:
    pass

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
        per_page = request.args.get('per_page', 15, type=int)
        search_query = request.args.get('search_query', '', type=str)
        
        query = User.query
        
        if search_query:
            search_term = f"%{search_query}%"
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
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        # 1. Login Activity
        login_activities = ActivityLog.query.filter_by(user_id=user_id, action='user_login').order_by(ActivityLog.created_at.desc()).limit(20).all()
        
        recent_ips = set()
        suspicious_logins = []
        for log in login_activities:
            if log.ip_address not in recent_ips:
                if len(recent_ips) > 0:
                    suspicious_logins.append(log.log_id)
                recent_ips.add(log.ip_address)

        login_history = [{
            "id": log.log_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "time": log.created_at.isoformat() + 'Z',
            "is_suspicious": log.log_id in suspicious_logins
        } for log in login_activities]

        # 2. Active Sessions
        active_sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        session_details = [{
            "id": session.session_id,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "last_activity": session.last_activity.isoformat() + 'Z'
        } for session in active_sessions]

        # 3. Audit Trail
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
    try:
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        recent_logs_query = ApiLog.query.filter(ApiLog.timestamp >= twenty_four_hours_ago)
        avg_response_time = recent_logs_query.with_entities(func.avg(ApiLog.response_time_ms)).scalar()
        
        total_requests = recent_logs_query.count()
        server_errors = recent_logs_query.filter(ApiLog.status_code >= 500).count()
        error_rate = (server_errors / total_requests * 100) if total_requests > 0 else 0
        
        slowest_endpoints = db.session.query(
            ApiLog.endpoint,
            ApiLog.method,
            func.avg(ApiLog.response_time_ms).label('avg_time')
        ).filter(ApiLog.timestamp >= twenty_four_hours_ago).group_by(
            ApiLog.endpoint, ApiLog.method
        ).order_by(func.avg(ApiLog.response_time_ms).desc()).limit(5).all()

        job_stats = db.session.query(
            ResumeEnhancement.enhancement_status,
            func.count(ResumeEnhancement.enhancement_id)
        ).group_by(ResumeEnhancement.enhancement_status).all()
        
        recent_failed_jobs = ResumeEnhancement.query.filter_by(enhancement_status='failed')\
            .order_by(ResumeEnhancement.completed_at.desc()).limit(5).all()

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

@admin_bp.route('/support-tickets/unresolved-count', methods=['GET'])
@admin_required()
def get_unresolved_ticket_count():
    try:
        unresolved_count = db.session.query(func.count(SupportTicket.id))\
                                     .filter(SupportTicket.status == 'unresolved')\
                                     .scalar()
        return jsonify({'unresolved_count': unresolved_count}), 200
    except Exception as e:
        print(f"Error fetching unresolved ticket count: {e}")
        return jsonify(message="Failed to fetch ticket count", error=str(e)), 500

@admin_bp.route('/support-tickets', methods=['GET'])
@admin_required()
def get_support_tickets():
    try:
        tickets = SupportTicket.query.order_by(
            SupportTicket.status.asc(), 
            SupportTicket.submitted_at.desc()
        ).all()
        return jsonify([ticket.to_dict() for ticket in tickets]), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve support tickets", error=str(e)), 500

@admin_bp.route('/support-tickets/<int:ticket_id>/resolve', methods=['PUT'])
@admin_required()
def resolve_support_ticket(ticket_id):
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify(message="Ticket not found"), 404
        
        ticket.status = 'resolved'
        ticket.resolved_at = datetime.utcnow()
        db.session.commit()

        try:
            email_service = EmailService()
            email_service.send_ticket_resolved_confirmation(
                to_email=ticket.email,
                user_name=ticket.name,
                ticket_subject=ticket.subject
            )
            print(f"Successfully sent 'resolved' email to {ticket.email}")
        except Exception as email_e:
            print(f"WARNING: Failed to send 'resolved' email for ticket {ticket_id}: {str(email_e)}")
        
        return jsonify(message="Ticket marked as resolved", ticket=ticket.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Failed to update ticket status", error=str(e)), 500

@admin_bp.route('/support-tickets/<int:ticket_id>', methods=['GET'])
@admin_required()
def get_ticket_details(ticket_id):
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify(message="Ticket not found"), 404
        
        ticket_data = ticket.to_dict()
        ticket_data['replies'] = [reply.to_dict() for reply in ticket.replies.order_by(TicketReply.sent_at.asc())]
        
        return jsonify(ticket_data), 200
    except Exception as e:
        return jsonify(message="Failed to retrieve ticket details", error=str(e)), 500

@admin_bp.route('/support-tickets/<int:ticket_id>/reply', methods=['POST'])
@admin_required()
def post_ticket_reply(ticket_id):
    try:
        admin_id = get_jwt_identity()
        data = request.get_json()
        reply_message = data.get('reply_message')

        if not reply_message or not reply_message.strip():
            return jsonify(message="Reply message cannot be empty"), 400

        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify(message="Ticket not found"), 404

        new_reply = TicketReply(
            ticket_id=ticket_id,
            user_id=admin_id,
            reply_message=reply_message.strip()
        )
        db.session.add(new_reply)
        db.session.commit()
        return jsonify(new_reply.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(message="Failed to post reply", error=str(e)), 500

@admin_bp.route('/broadcast-email', methods=['POST'])
@admin_required()
def broadcast_email():
    data = request.get_json()
    subject = data.get('subject')
    message = data.get('message')

    if not subject or not message:
        return jsonify(success=False, message="Subject and message are required."), 400

    try:
        active_users = User.query.filter_by(is_active=True).all()
        if not active_users:
            return jsonify(success=False, message="No active users found."), 404

        email_service = EmailService()
        sent_count = 0
        failed_count = 0

        for user in active_users:
            success = email_service.send_broadcast_email(
                to_email=user.email,
                user_name=user.first_name or user.username,
                subject=subject,
                html_message=message
            )
            if success:
                sent_count += 1
            else:
                failed_count += 1
        
        return jsonify(
            success=True,
            message=f"Broadcast sent. {sent_count} emails successful, {failed_count} failed."
        ), 200

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/analytics/visitors', methods=['GET'])
@admin_required()
def get_visitor_analytics():
    try:
        property_id = os.getenv('GA_PROPERTY_ID')
        if not property_id:
            raise Exception("GA_PROPERTY_ID is not set in environment variables.")

        client = BetaAnalyticsDataClient()
        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=[Dimension(name="date")],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="sessions"),
            ],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            order_bys=[Dimension(name="date").order_by_dimension("ASCENDING")]
        )

        response = client.run_report(request)
        
        labels = []
        visitors = []
        pageviews = []
        sessions = []
        total_visitors = 0
        total_pageviews = 0
        total_sessions = 0

        for row in response.rows:
            labels.append(datetime.strptime(row.dimension_values[0].value, "%Y%m%d").strftime("%m/%d"))
            visitors.append(int(row.metric_values[0].value))
            pageviews.append(int(row.metric_values[1].value))
            sessions.append(int(row.metric_values[2].value))
            
            total_visitors += int(row.metric_values[0].value)
            total_pageviews += int(row.metric_values[1].value)
            total_sessions += int(row.metric_values[2].value)

        return jsonify({
            "daily_chart": {
                "labels": labels,
                "visitors": visitors,
                "pageviews": pageviews,
                "sessions": sessions,
            },
            "totals": {
                "visitors": total_visitors,
                "pageviews": total_pageviews,
                "sessions": total_sessions,
            }
        }), 200

    except Exception as e:
        print(f"Error fetching Google Analytics data: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify(message="Failed to retrieve analytics data. Check server logs and GA configuration.", error=str(e)), 500

# --- START OF NEW BILLING ROUTES ---

def _parse_date_range(request_args):
    """Helper to parse start/end dates, defaulting to today and converting to UTC."""
    
    # Get today in UTC, then find start (midnight) and end (just before midnight)
    today_utc = datetime.utcnow().date()
    start_of_day_utc = datetime.combine(today_utc, datetime.min.time(), tzinfo=timezone.utc)
    end_of_day_utc = datetime.combine(today_utc, datetime.max.time(), tzinfo=timezone.utc)

    try:
        # Get from query params, fallback to today's UTC ISO string
        start_date_str = request_args.get('start_date', start_of_day_utc.isoformat())
        end_date_str = request_args.get('end_date', end_of_day_utc.isoformat())

        # Parse date strings
        start = datetime.fromisoformat(start_date_str)
        end = datetime.fromisoformat(end_date_str)
        
        # If naive, assume it's UTC
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        # Convert to UTC
        start_utc = start.astimezone(timezone.utc)
        end_utc = end.astimezone(timezone.utc)
        
        # If only a date (like YYYY-MM-DD) was provided, set time
        if start_utc.time() == datetime.min.time():
             start_utc = datetime.combine(start_utc.date(), datetime.min.time(), tzinfo=timezone.utc)
        if end_utc.time() == datetime.min.time():
             end_utc = datetime.combine(end_utc.date(), datetime.max.time(), tzinfo=timezone.utc)
             
    except Exception as e:
        print(f"Date parsing error: {e}. Defaulting to today UTC.")
        start_utc = start_of_day_utc
        end_utc = end_of_day_utc
        
    return start_utc, end_utc

@admin_bp.route('/billing/revenue-stats', methods=['GET'])
@admin_required()
def get_revenue_stats():
    """Provides revenue and transaction counts for a given date range."""
    try:
        start_date, end_date = _parse_date_range(request.args)

        stats = db.session.query(
            func.sum(Transaction.amount),
            func.count(Transaction.transaction_id)
        ).filter(
            Transaction.status == 'completed',
            Transaction.created_at.between(start_date, end_date)
        ).first()

        total_revenue = stats[0] if stats[0] is not None else 0
        total_transactions = stats[1] if stats[1] is not None else 0

        return jsonify({
            "total_revenue": float(total_revenue),
            "total_transactions": total_transactions,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }), 200

    except Exception as e:
        print(f"Error in /revenue-stats: {e}")
        return jsonify(message="Failed to retrieve revenue stats", error=str(e)), 500

@admin_bp.route('/billing/subscription-activity', methods=['GET'])
@admin_required()
def get_subscription_activity():
    """Provides a paginated list of ALL transactions (subs and top-ups) in a date range."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 15
        start_date, end_date = _parse_date_range(request.args)
        
        # Query for ALL completed transactions, and LEFT JOIN subscriptions/plans
        query = db.session.query(
            Transaction, User, SubscriptionPlan
        ).join(
            User, User.user_id == Transaction.user_id
        ).outerjoin( # Use outerjoin (LEFT JOIN)
            UserSubscription, UserSubscription.subscription_id == Transaction.subscription_id
        ).outerjoin( # Use outerjoin (LEFT JOIN)
            SubscriptionPlan, SubscriptionPlan.plan_id == UserSubscription.plan_id
        ).filter(
            Transaction.status == 'completed',
            Transaction.created_at.between(start_date, end_date)
        ).order_by(
            Transaction.created_at.desc()
        )

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        subscribers_data = []
        for transaction, user, plan in pagination.items:
            
            date_str = None
            if transaction.created_at:
                created_at_dt = transaction.created_at
                if created_at_dt.tzinfo is None:
                    created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
                date_str = created_at_dt.isoformat()

            # If plan is None, it's a top-up. Use the transaction description.
            if plan is None:
                plan_name = transaction.description or "Top-Up Credits"
            else:
                plan_name = plan.plan_name

            subscribers_data.append({
                "transaction_id": transaction.transaction_id,
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "plan_name": plan_name,
                "amount": float(transaction.amount),
                "date": date_str
            })

        return jsonify({
            "subscribers": subscribers_data,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify(message="Failed to retrieve subscription activity", error=str(e)), 500