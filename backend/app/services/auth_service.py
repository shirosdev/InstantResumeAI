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
        """
        Assign free 10-enhancement plan to new user.
        MODIFIED: This now matches the "Freemium" plan from Pricing.jsx
        """
        try:
            # CRITICAL FIX: Find the 'Freemium' plan with 10 enhancements
            free_plan = SubscriptionPlan.query.filter_by(
                plan_name='Freemium',
                resume_limit=10
            ).first()

            if not free_plan:
                print("CRITICAL ERROR: Could not find the 'Freemium' (10 enhancement) plan in the database!")
                print("Please run the seed_plans.py script.")
                return False

            print(f"Assigning plan_id={free_plan.plan_id} ({free_plan.plan_name}) to user_id={user_id}")

            # Create subscription with enhancement_credits explicitly set to 0
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=free_plan.plan_id,
                start_date=datetime.utcnow().date(),
                end_date=None, # Free plan doesn't expire
                status='active',
                auto_renew=False,
                enhancement_credits=0  # Explicitly initialize to 0
            )
            db.session.add(subscription)
            db.session.commit()

            AuthService.log_activity(
                user_id,
                'subscription_created',
                f'Freemium plan assigned to user (plan_id={free_plan.plan_id})'
            )

            print(f"Successfully assigned subscription to user_id={user_id}")
            return True

        except Exception as e:
            print(f"Error assigning free subscription: {e}")
            import traceback
            print(traceback.format_exc())
            db.session.rollback()
            return False