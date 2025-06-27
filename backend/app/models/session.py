# backend/app/models/session.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

class UserSession(db.Model):
    """User session model for tracking authentication sessions"""
    __tablename__ = 'user_sessions'
    
    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship('User', back_populates='sessions')
    
    def __repr__(self):
        return f'<UserSession {self.session_token} for user {self.user_id}>'