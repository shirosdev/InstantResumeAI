# backend/app/models/resume.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship

class ResumeEnhancement(db.Model):
    """Model for tracking resume enhancement jobs"""
    __tablename__ = 'resume_enhancements'
    
    enhancement_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    original_filename = Column(String(255))
    enhanced_filename = Column(String(255))
    file_path = Column(String(500))
    enhancement_status = Column(Enum('pending', 'completed', 'failed'), default='pending')
    job_description_snippet = Column(Text)
    enhancement_summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship('User', back_populates='enhancements')

    def __repr__(self):
        return f'<ResumeEnhancement {self.enhancement_id} for user {self.user_id}>'