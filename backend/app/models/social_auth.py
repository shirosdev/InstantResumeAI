# backend/app/models/social_auth.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship

class SocialAuth(db.Model):
    """Social authentication model for OAuth providers"""
    __tablename__ = 'social_auth'
    
    social_auth_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    provider = Column(Enum('google', 'facebook', 'linkedin', 'github'), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship('User', back_populates='social_auth')
    
    def __repr__(self):
        return f'<SocialAuth {self.provider} for user {self.user_id}>'