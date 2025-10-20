# backend/app/models/subscription.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Date, Enum
from sqlalchemy.dialects.mssql import DECIMAL
from sqlalchemy.orm import relationship

class SubscriptionPlan(db.Model):
    """Subscription plan model for different pricing tiers"""
    __tablename__ = 'subscription_plans'
    
    plan_id = Column(Integer, primary_key=True, autoincrement=True)
    plan_name = Column(String(100), nullable=False)
    plan_type = Column(Enum('free', 'monthly', 'quarterly', 'semi_annual', 'annual'), nullable=False)
    price = Column(DECIMAL(10, 2), default=0.00)
    duration_days = Column(Integer, nullable=False)
    resume_limit = Column(Integer, nullable=True)  # NULL for unlimited
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    subscriptions = relationship('UserSubscription', back_populates='plan')
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.plan_name}>'

class UserSubscription(db.Model):
    """User subscription model for tracking active subscriptions"""
    __tablename__ = 'user_subscriptions'
    
    subscription_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    plan_id = Column(Integer, ForeignKey('subscription_plans.plan_id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # NULL for unlimited
    status = Column(Enum('active', 'expired', 'cancelled', 'pending'), default='active')
    auto_renew = Column(Boolean, default=False)
    enhancement_credits = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='subscriptions')
    plan = relationship('SubscriptionPlan', back_populates='subscriptions')
    
    def __repr__(self):
        return f'<UserSubscription {self.subscription_id} for user {self.user_id}>'