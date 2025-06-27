# backend/app/services/auth_service.py

from app import db
from app.models.user import User
from app.models.activity import ActivityLog
from app.models.subscription import UserSubscription, SubscriptionPlan
from datetime import datetime

class AuthService:
    """Service class for authentication-related operations"""
    
    @staticmethod
    def log_activity(user_id, action, description, ip_address=None, user_agent=None, metadata=None):
        """Log user activity to the database"""
        try:
            activity = ActivityLog(
                user_id=user_id,
                action=action,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                activity_metadata=metadata,
                created_at=datetime.utcnow()
            )
            db.session.add(activity)
            db.session.commit()
        except Exception as e:
            print(f"Error logging activity: {e}")
            db.session.rollback()
    
    @staticmethod
    def assign_free_subscription(user_id):
        """Assign free unlimited subscription to new user"""
        try:
            # Find the free plan
            free_plan = SubscriptionPlan.query.filter_by(plan_type='free').first()
            if not free_plan:
                print("Warning: Free plan not found in database")
                return False
            
            # Create subscription
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=free_plan.plan_id,
                start_date=datetime.utcnow().date(),
                end_date=None,  # Unlimited
                status='active',
                auto_renew=False
            )
            db.session.add(subscription)
            db.session.commit()
            
            # Log the activity
            AuthService.log_activity(
                user_id, 
                'subscription_created', 
                f'Free unlimited subscription assigned to user'
            )
            
            return True
            
        except Exception as e:
            print(f"Error assigning free subscription: {e}")
            db.session.rollback()
            return False