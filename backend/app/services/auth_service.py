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
        """Assign free 3-enhancement plan to new user"""
        try:
            # CRITICAL FIX: Explicitly select the limited free plan by name and limit.
            free_plan = SubscriptionPlan.query.filter_by(
                plan_name='Free - 3 Enhancements',
                resume_limit=3 
            ).first()

            if not free_plan:
                print("CRITICAL ERROR: Could not find the 'Free - 3 Enhancements' plan in the database!")
                return False

            print(f"Assigning plan_id={free_plan.plan_id} ({free_plan.plan_name}) to user_id={user_id}")

            # Create subscription with enhancement_credits explicitly set to 0
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=free_plan.plan_id,
                start_date=datetime.utcnow().date(),
                end_date=None,
                status='active',
                auto_renew=False,
                enhancement_credits=0  # Explicitly initialize to 0
            )
            db.session.add(subscription)
            db.session.commit()

            AuthService.log_activity(
                user_id,
                'subscription_created',
                f'Free - 3 Enhancements plan assigned to user (plan_id={free_plan.plan_id})'
            )

            print(f"Successfully assigned subscription to user_id={user_id}")
            return True

        except Exception as e:
            print(f"Error assigning free subscription: {e}")
            import traceback
            print(traceback.format_exc())
            db.session.rollback()
            return False