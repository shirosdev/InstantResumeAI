# backend/app/models/activity.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

class ActivityLog(db.Model):
    """Activity log model for tracking user actions"""
    __tablename__ = 'activity_logs'
    
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    action = Column(String(100), nullable=False)
    description = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    activity_metadata = Column('metadata', JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship('User', back_populates='activity_logs')
    
    def __repr__(self):
        return f'<ActivityLog {self.action} by user {self.user_id}>'