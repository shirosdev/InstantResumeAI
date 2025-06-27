# backend/app/models/user.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship

class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'users'
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable for social login
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone_number = Column(String(20))
    profile_picture_url = Column(String(500))
    bio = Column(Text)
    location = Column(String(255))
    profession = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255))
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    social_auth = relationship('SocialAuth', back_populates='user', cascade='all, delete-orphan')
    subscriptions = relationship('UserSubscription', back_populates='user', cascade='all, delete-orphan')
    sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    activity_logs = relationship('ActivityLog', back_populates='user', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert user object to dictionary for JSON serialization"""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'profile_picture_url': self.profile_picture_url,
            'bio': self.bio,
            'location': self.location,
            'profession': self.profession,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'